# Workflow validation evidence

Date: 2026-09-28 (Asia/Seoul)

## Environment

- Git repository: `main`; working tree was clean before setup.
- Frontend: React 19, TypeScript, Vite; npm with existing `package-lock.json`.
- Backend: Spring Boot 3.5, Gradle wrapper 8.14.3, Java 21, PostgreSQL runtime, H2 test runtime, JUnit 5.
- Existing test tooling: Playwright 1.63 (Chromium configured through Edge channel), JUnit 5. No test dependency was added.
- Superpowers plugin: `superpowers@openai-curated` installed and enabled (`fef63ecf`).
- Codex CLI: `codex-cli 0.152.1`; `codex login status` reported `Logged in using ChatGPT`.

## Commands and results

| Check | Command | Result |
|---|---|---|
| Frontend build | `cd frontend; npm run build` | PASS, exit 0; TypeScript and Vite production build succeeded. |
| Backend unit/integration/API tests | `$env:JAVA_HOME='C:\Program Files\Java\jdk-21'; .\gradlew.bat test --rerun-tasks` from `backend` | PASS, exit 0; all Gradle test tasks ran under Java 21. Existing Spring MockMvc and H2 integration tests are included. |
| Browser E2E | `cd frontend; npm run test:ui` | PASS, exit 0; 36/36 Playwright tests passed across desktop, tablet, mobile-390 and mobile-320. |
| Recovery PowerShell syntax | `[System.Management.Automation.Language.Parser]::ParseFile(...codex-resume.ps1...)` | PASS, no parse errors. |
| Idle recovery dry-run | `powershell.exe -File .codex/scripts/codex-resume.ps1 -DryRun` | PASS, exit 0; STATE `IDLE` produced `SKIP` and did not invoke Codex. See `../logs/recovery.log`. |
| Codex CLI login | `codex login status` | PASS; ChatGPT login, no `OPENAI_API_KEY` was present in the checked process environment. |
| Codex CLI invocation | `codex exec -m gpt-5.6-sol --ephemeral --strict-config --approve-for-me ...` with a no-write prompt | PASS, exit 0; returned `CODEX_EXEC_READY` using provider `openai` and the ChatGPT login. |
| Built-in agents | Read-only CLI smoke requested built-in `explorer` and `worker` concurrently | PASS; both returned, explorer reported concurrency limit 2. |
| Custom agents | Independent read-only `reviewer` and `qa` agent smoke checks | PASS; reviewer confirmed `read-only`; QA confirmed its configured test-only scope. |
| Reviewer | Read-only diff review of workflow files and recovery logic | PASS; no blocking findings. |
| Superpowers plugin | `codex plugin add superpowers@openai-curated --json` | PASS; installed from the configured OpenAI-curated marketplace. |
| Windows scheduler | `schtasks /Create ... /SC MINUTE /MO 60 /TN CodexBondProjectRecovery ... /IT`; `/Query /V /FO LIST`; then `/Run` | PASS; task is Ready and Enabled, hourly, interactive-only, current user. Manual run returned Last Result `0` and recovery log showed IDLE skip. |

Backend Gradle XML reports contained 104 tests across 37 report files: 0 failures, 0 errors, 0 skipped.

## Notes

- No frontend or backend test dependency was installed because the project already had Playwright, JUnit, and all required packages.
- The installed CLI rejects `--full-auto`. Recovery uses supported `--approve-for-me`, which runs in its workspace-write sandbox with automatic review, and pins the ChatGPT-supported `gpt-5.6-sol` model available in this CLI catalog. Missing CLI or login changes STATE to `BLOCKED` for human action.
- The E2E suite writes capture snapshots into `docs/design/`. It overwrote one tracked capture during this verification; because the file was clean at initial inspection, only that generated change was restored to HEAD. The final diff contains no capture changes.
- The verification did not start any Bonda product feature task. The task queue remains empty and STATE is `IDLE`.
