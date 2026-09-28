[CmdletBinding()]
param([switch]$DryRun)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$statusPath = Join-Path $projectRoot 'STATUS.md'
$lockPath = Join-Path $projectRoot '.codex\recovery.lock'
$logPath = Join-Path $projectRoot '.codex\logs\recovery.log'
$threshold = [TimeSpan]::FromMinutes(90)

New-Item -ItemType Directory -Path (Split-Path $logPath) -Force | Out-Null

function Write-RecoveryLog([string]$Message) {
    $line = '{0} {1}' -f (Get-Date).ToString('yyyy-MM-ddTHH:mm:ssK'), $Message
    Add-Content -LiteralPath $logPath -Value $line -Encoding utf8
}

function Set-StatusField([string]$Name, [string]$Value) {
    $stateText = Get-Content -LiteralPath $statusPath -Raw
    $pattern = '(?m)^' + [regex]::Escape($Name) + ':.*$'
    $replacement = '{0}: {1}' -f $Name, $Value
    $stateText = [regex]::Replace($stateText, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($match) $replacement })
    [System.IO.File]::WriteAllText($statusPath, $stateText, [System.Text.UTF8Encoding]::new($false))
}

if (-not (Test-Path -LiteralPath $statusPath)) {
    Write-RecoveryLog 'result=SKIP reason=STATUS_NOT_FOUND'
    exit 0
}

$stateText = Get-Content -LiteralPath $statusPath -Raw
$statusMatch = [regex]::Match($stateText, '(?m)^status:\s*(\S+)\s*$')
$heartbeatMatch = [regex]::Match($stateText, '(?m)^heartbeat:\s*(.+?)\s*$')
$state = if ($statusMatch.Success) { $statusMatch.Groups[1].Value } else { 'UNKNOWN' }
$eligible = $state -eq 'WAITING_FOR_RESET'
$age = $null

if (-not $eligible -and $state -eq 'RUNNING' -and $heartbeatMatch.Success) {
    try {
        $heartbeat = [DateTimeOffset]::Parse($heartbeatMatch.Groups[1].Value.Trim())
        $age = [DateTimeOffset]::Now - $heartbeat
        $eligible = $age -gt $threshold
    } catch {
        Write-RecoveryLog 'result=SKIP reason=INVALID_HEARTBEAT'
        exit 0
    }
}

if (-not $eligible) {
    Write-RecoveryLog "result=SKIP state=$state reason=NOT_ELIGIBLE"
    exit 0
}

# A stale file can be reopened only after the owning process released its exclusive handle.
# This also reclaims an abandoned lock safely without relying on PID reuse heuristics.
$lockStream = $null
try {
    $lockStream = [System.IO.File]::Open($lockPath, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
} catch [System.IO.IOException] {
    Write-RecoveryLog "result=SKIP state=$state reason=LOCK_HELD"
    exit 0
}

try {
    $lockStream.SetLength(0)
    $lockBytes = [Text.Encoding]::UTF8.GetBytes("pid=$PID started=$((Get-Date).ToString('o'))")
    $lockStream.Write($lockBytes, 0, $lockBytes.Length)
    $lockStream.Flush()

    # Re-read state after acquiring the lock so concurrent invocations cannot act on stale input.
    $stateText = Get-Content -LiteralPath $statusPath -Raw
    $statusMatch = [regex]::Match($stateText, '(?m)^status:\s*(\S+)\s*$')
    $state = if ($statusMatch.Success) { $statusMatch.Groups[1].Value } else { 'UNKNOWN' }
    $heartbeatMatch = [regex]::Match($stateText, '(?m)^heartbeat:\s*(.+?)\s*$')
    $eligible = $state -eq 'WAITING_FOR_RESET'
    if (-not $eligible -and $state -eq 'RUNNING' -and $heartbeatMatch.Success) {
        try { $eligible = (([DateTimeOffset]::Now - [DateTimeOffset]::Parse($heartbeatMatch.Groups[1].Value.Trim())) -gt $threshold) } catch { $eligible = $false }
    }
    if (-not $eligible) {
        Write-RecoveryLog "result=SKIP state=$state reason=STATE_CHANGED"
        exit 0
    }

    Write-RecoveryLog "attempt=START state=$state age_minutes=$(if ($null -ne $age) { [math]::Floor($age.TotalMinutes) } else { 'n/a' })"
    if ($DryRun) {
        Write-RecoveryLog "attempt=DRY_RUN state=$state result=WOULD_RESUME"
        exit 0
    }

    try {
        $rootPattern = [regex]::Escape($projectRoot)
        $active = Get-CimInstance Win32_Process -Filter "Name='codex.exe' OR Name='Codex.exe'" -ErrorAction Stop |
            Where-Object { $_.CommandLine -and $_.CommandLine -match $rootPattern -and $_.CommandLine -match '(?i)\bexec\b' } |
            Select-Object -First 1
        if ($active) {
            Write-RecoveryLog 'result=SKIP state=ACTIVE reason=ACTIVE_CODEX_PROJECT_PROCESS'
            exit 0
        }
    } catch {
        Write-RecoveryLog 'process_check=UNAVAILABLE result=CONTINUE'
    }

    $codexCommand = Get-Command codex -ErrorAction SilentlyContinue
    if (-not $codexCommand) {
        Set-StatusField 'status' 'BLOCKED'
        Set-StatusField 'last_error' 'CODEX_CLI_NOT_FOUND'
        Set-StatusField 'heartbeat' (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssK')
        Write-RecoveryLog 'attempt=END result=BLOCKED error=CODEX_CLI_NOT_FOUND'
        exit 2
    }

    $loginOutput = & $codexCommand.Source login status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Set-StatusField 'status' 'BLOCKED'
        Set-StatusField 'last_error' 'CODEX_LOGIN_REQUIRED'
        Set-StatusField 'heartbeat' (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssK')
        Write-RecoveryLog 'attempt=END result=BLOCKED error=CODEX_LOGIN_REQUIRED'
        exit 3
    }

    $prompt = @'
Read AGENTS.md and STATUS.md. Read PLAN.md, SPEC.md, git status, and relevant git diff as needed. Resume the current milestone from next_action; do not redo completed work. Main Codex implements and runs tests directly. Use subagents only for independent read-only investigation; never spawn child agents. Run relevant deterministic tests. At milestone completion, review once and classify findings as BLOCKER or FOLLOW-UP; fix blockers and repeat review at most once. Update STATUS.md after meaningful progress. If human action is required set BLOCKED; if Codex usage is unavailable set WAITING_FOR_RESET; if all approved milestones are complete set DONE. Preserve user changes. Do not perform large dependency upgrades, destructive DB migrations, production deploys, credential changes, force push, reset --hard, or branch deletion. Use ChatGPT login, never OPENAI_API_KEY.
'@
    $detailLog = Join-Path $projectRoot '.codex\logs\codex-resume-last.log'
    # This installed CLI version does not expose --full-auto. Use its supported
    # workspace-scoped automatic-review mode so no API key or unrestricted host access is needed.
    $prompt | & $codexCommand.Source exec -m gpt-5.6-sol --approve-for-me --json --cd $projectRoot - *> $detailLog
    $execExit = $LASTEXITCODE
    $result = if ($execExit -eq 0) { 'FINISHED' } else { 'FAILED' }
    if ($execExit -ne 0) {
        $afterText = Get-Content -LiteralPath $statusPath -Raw
        $afterStatusMatch = [regex]::Match($afterText, '(?m)^status:\s*(\S+)\s*$')
        $afterStatus = if ($afterStatusMatch.Success) { $afterStatusMatch.Groups[1].Value } else { 'UNKNOWN' }
        if ($afterStatus -in @('RUNNING', 'WAITING_FOR_RESET')) {
            Set-StatusField 'status' 'WAITING_FOR_RESET'
            Set-StatusField 'last_error' "CODEX_EXEC_EXIT_$execExit"
            Set-StatusField 'heartbeat' (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssK')
        }
    }
    Write-RecoveryLog "attempt=END state=$state codex_exec_exit_code=$execExit result=$result detail_log=.codex/logs/codex-resume-last.log"
    exit $execExit
} catch {
    Write-RecoveryLog ("result=ERROR error={0}" -f ($_.Exception.Message -replace '[\r\n]+', ' '))
    exit 1
} finally {
    if ($null -ne $lockStream) {
        $lockStream.Dispose()
        Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue
    }
}
