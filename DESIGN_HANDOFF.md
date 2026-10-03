# DESIGN HANDOFF

status:
READY_FOR_REVIEW

review_round:
0

target:
Stage 3 — Evidence(`/sources/...`)와 Historical Replay(`/replay`)의 첫 화면 정보 우선순위 및 경로 간 쉬운 문구 정리. Stage 1·2는 디자인 PASS 후 `33d0d2ca949e94a96ab1fa301512b14b477a70ec`까지 origin/main에 push됐다.

viewports:

- desktop 1440 × 900
- mobile 390 × 844

screenshots:

- Stage 1 Before: [monitoring desktop](design/audit/current/monitoring-desktop-1440.png), [monitoring mobile](design/audit/current/monitoring-mobile-390.png)
- Stage 1 After: [monitoring desktop 1440×900](design/audit/2026-10-02-redesign/stage-1/monitoring-desktop-1440x900.png), [monitoring mobile 390×844](design/audit/2026-10-02-redesign/stage-1/monitoring-mobile-390x844.png)
- Stage 1 full-page evidence: [desktop](design/audit/2026-10-02-redesign/stage-1/monitoring-desktop-full.png), [mobile](design/audit/2026-10-02-redesign/stage-1/monitoring-mobile-full.png). Before 파일은 갱신하지 않았다.
- Stage 1 S1-R1 review: [desktop 기본 선택](design/audit/2026-10-02-redesign/stage-1/monitoring-r1-desktop-default-1440x900.png), [desktop 대한항공 선택](design/audit/2026-10-02-redesign/stage-1/monitoring-r1-desktop-quiet-1440x900.png), [mobile 기본 선택](design/audit/2026-10-02-redesign/stage-1/monitoring-r1-mobile-default-390x844.png), [mobile 대한항공 선택](design/audit/2026-10-02-redesign/stage-1/monitoring-r1-mobile-quiet-390x844.png).
- Stage 2 Before: [holding desktop](design/audit/current/holding-desktop-1440.png). 원래 mobile Before는 Designer가 2026-10-03 직접 검수했으나 untracked `design/audit/current/holding-mobile-390.png`가 이후 과거 캡처 테스트로 덮여 현재 파일은 Before 근거가 아니다. 원본 bytes를 복구할 수 없어 이 경로를 Before 비교에 사용하지 않는다.
- Stage 2 After: [holding desktop 1440×900](design/audit/2026-10-02-redesign/stage-2/holding-desktop-1440x900.png), [holding mobile 390×844](design/audit/2026-10-02-redesign/stage-2/holding-mobile-390x844.png), [desktop full-page](design/audit/2026-10-02-redesign/stage-2/holding-desktop-full.png), [mobile full-page](design/audit/2026-10-02-redesign/stage-2/holding-mobile-full.png). Before 파일은 갱신하지 않았다.
- Stage 3 Before: [evidence desktop](design/audit/current/source-desktop-1440.png), [evidence mobile](design/audit/current/source-mobile-390.png), [Replay desktop](design/audit/current/replay-desktop-1440.png), [Replay mobile](design/audit/current/replay-mobile-390.png)
- Stage 3 Evidence After (중간 검수): [desktop 1440×900](design/audit/2026-10-02-redesign/stage-3/evidence-desktop-1440x900.png), [mobile 390×844](design/audit/2026-10-02-redesign/stage-3/evidence-mobile-390x844.png), [desktop full-page](design/audit/2026-10-02-redesign/stage-3/evidence-desktop-full.png), [mobile full-page](design/audit/2026-10-02-redesign/stage-3/evidence-mobile-full.png). Before 파일은 갱신하지 않았다.
- Stage 3 Replay After: [desktop 1440×900](design/audit/2026-10-02-redesign/stage-3/replay-desktop-1440x900.png), [mobile 390×844](design/audit/2026-10-02-redesign/stage-3/replay-mobile-390x844.png), [desktop full-page](design/audit/2026-10-02-redesign/stage-3/replay-desktop-full.png), [mobile full-page](design/audit/2026-10-02-redesign/stage-3/replay-mobile-full.png). `선택한 날짜까지 공개된 정보`로 cutoff 의미를 바로잡은 뒤 다시 캡처했다.
- 각 Stage의 After 캡처는 `design/audit/2026-10-02-redesign/stage-N/`에 같은 fixture·viewport로 별도 저장한다. Before를 덮어쓰지 않는다.

blockers:

- Stage 3: 없음. Evidence·Replay의 1440×900·390×844 최종 캡처와 QA에서 정보 우선순위·cutoff 문구·근거 연결을 확인했다.

improvements:

- 짧은 데모 데이터 때문에 Evidence·Replay의 데스크톱 하단에는 큰 빈 공간이 남는다. 현재 출시를 막지는 않으며 임의의 장식이나 가짜 데이터를 채우지 않는다.
- Stage 2 원래 mobile Before의 untracked 파일이 과거 캡처 테스트로 덮였다. Stage 3 Evidence·Replay Before/After는 온전하며, 손상된 Holding 경로를 Before 근거로 사용하지 않는다.

## 제품·사용자 기준

- 사용자는 채권 용어를 모를 수 있다. 첫 390px viewport에서 `어느 채권에 / 언제 / 무엇이 달라졌는가`를 설명 없이 읽어야 한다. 다음 행동은 `변화 내용 보기` 또는 `공시 근거 보기`다.
- 일상적인 받은편지함·활동 내역처럼 새 변화를 먼저 두고, 자세한 기록·계산은 사용자가 열어 볼 때 제공한다. 총자산·수익률 hero나 거래 앱의 흥분을 차용하지 않는다.
- 화면 순서는 새 변화 → 채권 → 전후 숫자와 현재 상태 → 쉬운 설명 → 해당 주장 바로 아래의 근거 → 선택적 AI 설명이다. `새 변화 없음`을 `안전`이라고 표현하지 않는다.
- 실제 `RISK_POLICY_V1` 상태는 `NORMAL/WATCH/CAUTION`만 사용한다. 색은 계산된 위험 상태에만 쓰고, 색만으로 의미를 전달하지 않는다. 임의의 4단계 눈금·점수·투자 권유 문구는 만들지 않는다.
- 이 명세는 발표용 ledger/종이 시안과 무관하다. `design/rejected/ledger-purchase-line.md`의 거절 패턴을 다시 만들지 않는다.

## Stage 1 — `/monitoring`: 새 변화가 먼저 보이는 내 채권

implementation_tasks:

- [x] **S1-1 정보 구조:** 데스크톱은 목록 252px + 상세 작업면을 유지해도 되지만, 목록 상단을 `새로 확인할 변화 N건`으로 바꾸고 변화 있는 채권을 먼저 정렬한다. 변화 없는 채권은 목록 하단 접힌 `새 변화 없음 N개` 그룹으로 둔다. 모바일은 status band·selector·선택 채권 identity·최근 사건 제목·날짜·원문 진입점이 첫 844px 안에 보여야 한다. 기존 데모/검색/추가/탭 동작은 유지한다.
- [x] **S1-2 쉬운 상태 문구:** `AA / 안정적`은 `신용등급 AA · 전망 안정적`처럼 출처 성격이 읽히게 하고 Bonda 상태는 별도 줄 `Bonda 확인 상태 · 관찰`로 분리한다. 다섯 위험 범주 표는 `전체 상태 보기`로 접을 수 있게 하되, 변화에 관련된 범주와 상태는 사건 근처에 남긴다. 현재 정책 결과·등급·전망을 새로 계산하거나 결합하지 않는다.
- [x] **S1-3 증감의 의미:** `MonitoringPage.tsx`의 `(rate >= 0) ? up : down` 기반 초록/빨강 의미 부여를 제거한다. 정책이 악화·개선 영향을 제공하지 않는 현 데모 재무 행은 모두 중립 잉크색 증감률로 표시한다. 부호·수치·단위는 보존한다. 실제 위험 상태 색은 해당 상태 label에만 남긴다. 음수 cash flow도 0 기준을 잃지 않는다.
- [x] **S1-4 전후 그래프:** 각 재무 행은 기준·현재 두 실제 값을 같은 단위와 동일한 행 안에 표시한다. 두 시점만 있으므로 연속 추세선은 쓰지 않는다. 작은 2점 비교 또는 동일 축의 전후 막대를 사용하며, 그래프 옆에 `기준값 → 현재값 (+/− 변화율)` 텍스트를 항상 남긴다. 기간 데이터가 없는 demo에는 `매수 기준점 대비 현재`라는 확정 문구를 쓰지 말고 `데모 비교값`으로 명시한다. 임계값이 기존 데이터에 있는 행만 임계 tick을 허용한다.
- [x] **S1-5 친근한 변화 아이콘:** 기본 아이콘은 `이전의 작은 빈 점 → 현재의 채운 점`과 짧은 둥근 궤적을 가진 하나의 20–24px 도트 모티프로 시안화한다. 요약에서는 최대 40px. 뜻은 `새로 확인할 변화가 있음` 하나뿐이다. 상승·하락, 안전·위험, 변화 건수를 아이콘의 모양이나 색만으로 암시하지 않는다. 옆에 항상 `새 변화 N건` 텍스트를 둔다. 얼굴·sparkle·mascot·반복 장식 아이콘·상시 pulse는 쓰지 않는다.
- [x] **S1-6 시각적 제거:** 기존 상태 band의 시스템 설명과 영어 `Credit Pulse` 표제가 사건보다 먼저 눈에 들어오지 않게 낮춘다. 중복 count와 미사용 장식, 과도한 내부 경계를 삭제한다. 보조 날짜·출처는 12px 이상, 본문은 14px 이상, 터치 대상은 44px 이상을 목표로 한다.
- [x] **S1-R1 변화 없음 상태 수정:** `unread=0` 등 실제 새 변화가 0건인 채권을 선택했을 때, 채권 요약과 사건 요약에서 변화 도트 및 `새 변화 0건` 문구를 제거하고 `새로 확인할 변화 없음`을 중립 잉크색 텍스트로 표시한다. `정상` 채권의 선택 marker에 관찰/주의 주황색을 쓰지 않는다. 선택 자체는 accent/focus 표현으로만 구분한다. 실제 새 변화가 1건 이상인 채권의 도트·건수 표현은 유지한다. 대한항공 101을 390px·1440px에서 다시 캡처해 확인한다.

acceptance:

- [x] Stage 1 완료 전 동일 데모·기본 선택 채권으로 1440×900/390×844 viewport + 필요 시 전체 화면 캡처를 저장하고 Designer에게 경로를 보낸다. 커밋·push는 Designer의 캡처 검수 이후에만 한다.
- [x] 모바일 첫 viewport에서 채권명·최근 사건 제목·사건 날짜·현재 상태·원문 진입점을 읽을 수 있다. 도트 아이콘은 실제 정보보다 크게 보이지 않는다.
- [x] 현금성자산 감소·영업현금흐름 감소가 개선을 뜻하는 초록색으로 보이지 않는다. 기존 수치·부호·단위·선택 동작은 같다.
- [x] `npm run build`, `npm run check:ui`, 관련 `npm run test:ui`를 실제 실행하고 결과를 보고한다. 스크린샷만으로 동작 PASS를 주장하지 않는다.
- [x] 변화 없는 대한항공 101의 390px·1440px 재캡처에서 변화 도트와 주황색 상태 암시가 없고, 새 변화가 있는 두 채권에는 도트와 건수가 유지된다.
- [x] Designer가 Stage 1 PASS를 알리면 Stage 1에 속한 파일만 commit 후 `origin/main`에 push하고 SHA와 원격 결과를 보고한다. 기존 미커밋 `.codex`, `PLAN.md`, `STATUS.md`, 다른 design 자료는 자동 stage하지 않는다. 이미 더러웠던 frontend 파일의 기존 hunks는 확인하여 승인된 이전 디자인 변경인지 분리·보고한다.

## Stage 2 — `/holdings/:holdingId/since-bought`: 채권 초보자의 상세 읽기

- [x] **S2-1** 남색 `HOLDING PULSE` 안내 배너와 큰 질문 문장, 반복 `1개의 변화` 요약 보드를 제거한다. 모바일 상단은 채권명(최대 24px/32px) → 마지막 사건 제목·날짜 → 현재 확인 상태 → `원문에서 확인` 순서. 실제 사건이 없으면 `새 변화 없음`과 마지막 확인 시각을 보여 준다.
- [x] **S2-2** 다섯 위험 범주를 첫 화면에 일렬로 나열하지 않고 `전체 상태 보기` 펼침에 둔다. 사건과 위험 범주의 명시적 연결 정보가 API에 있을 때만 해당 범주를 사건 옆에 표시한다. 현재 SinceBoughtResponse에는 그 필드가 없으므로 이번 Stage 2에서는 제공된 Bonda 현재 상태만 사건 옆에 두고, 범주를 제목·severity에서 추정하지 않는다. 신용등급·전망이 응답에 있는 경우에만 Bonda 상태와 별도 표기한다.
- [x] **S2-3** 타임라인은 실제 날짜를 가진 사건만 배치하고 매수 기준점은 유지한다. 균등 간격의 선을 연속 시간축처럼 보이게 하지 않는다. 선택 사건의 날짜·제목·근거가 한 덩어리로 읽히게 한다.
- [x] **S2-4** AI 설명이 `NOT_NEEDED`이면 빈 `Bonda의 해석` 카드를 렌더링하지 않는다. 설명이 있을 때만 사실·계산 뒤의 접힌 `참고 설명`으로 제공한다. 재무 비교는 실제 기준 기간을 값 옆에 적고 위험 결론을 임의로 추가하지 않는다.
- [x] **S2-5** 현재 캡처의 `총차입금 2024 → 2025 +12.2%`처럼 정책상 악화·개선 의미가 별도 검증되지 않은 재무 증감은 빨간색과 상승 화살표로 경고처럼 표시하지 않는다. `2024년 값 → 2025년 값 · +12.2%`를 같은 행에서 중립 잉크색으로 보여 준다. 금액 단위·부호·정확한 기존 데이터는 유지한다. Stage 1의 두 점 비교를 재사용할 수 있을 때만 쓰고 연속 추세를 암시하는 선은 추가하지 않는다.
- [x] **S2-6 첫 화면 구조:** 모바일에서 앱 헤더 아래 첫 섹션을 `채권명(최대 24/32) + 매수일`의 짧은 identity 줄로 만들고, 그 바로 다음에 `최근 변화 제목 + 실제 날짜 + 관련 Bonda 범주/현재 상태 + 원문에서 확인`을 한 묶음으로 둔다. 이 묶음의 제목·날짜·상태·원문 버튼이 390×844 첫 viewport에 모두 보여야 한다. 데스크톱에서도 `HOLDING PULSE` 및 큰 남색 요약판 자리에 이 사건 묶음을 우선 배치한다. 남은 매수금액·추적기간 등 메타는 사건 뒤의 보조 정보로 둔다. 페이지 전체를 새 카드 그리드로 채우지 않는다.
- [x] Stage 2 1440/390 캡처와 build/check/UI test를 실행한다.
- [x] Designer가 Stage 2 캡처를 검수한 뒤 Stage 2 파일만 commit/push한다.
- [x] Stage 2 After는 같은 `[데모] 한결산업 1회 회사채` 데이터로 1440×900·390×844 및 full-page를 `design/audit/2026-10-02-redesign/stage-2/`에 저장한다. Before를 덮어쓰지 않는다. 화면과 기능 검수 전에는 commit/push하지 않는다.

## Stage 3 — Evidence·Replay와 전체 흐름

- [x] **S3-1 Evidence 첫 화면:** `SOURCE CHECK` 남색 배너와 거대한 `[데모] 2025 사업보고서` 제목을 제거한다. 화면 본문의 첫 정보는 기존 API가 제공한 사건과 일치하는 원문 인용문이다. 원문 텍스트를 새로 생성하거나 요약으로 대체하지 않는다. 인용문은 모바일 390×844 첫 viewport에 보이고, 문서명·공개일·접수번호는 인용문 바로 아래 또는 위의 작은 출처 줄에 둔다. Version은 응답에 실제 값이 있을 때만 표기한다. 현재 Evidence 응답에는 Version 번호가 없으므로 만들어 표시하지 않는다. 바깥 패널 → 파란 박스 → 안쪽 회색 박스 중첩을 하나의 문서 면과 1개 강조선 수준으로 단순화한다. 기존 하이라이트·원문 이동·검증 메타 기능은 유지한다.
- [x] **S3-2 Replay 첫 화면:** `HISTORICAL REPLAY` 배너와 `그때까지 알 수 있던 것만 봅니다` 거대 hero를 제거한다. 모바일은 짧은 화면 제목 → 발행사·기준일 입력과 실행 버튼 → `2026-03-14 당시 상태: 관찰`(데모 값) → 당시 공개된 사건 순서로 배치한다. 당시 상태와 첫 사건 제목이 390×844 첫 viewport에 함께 보여야 한다. 데스크톱에서도 폼 바로 아래에 당시 상태·공개 근거를 둔다. 현재 데이터가 따로 표시될 때는 `현재` 라벨과 분리 영역을 명시하며, 당시 영역에 cutoff 이후 데이터를 섞지 않는다. 정책 계산·cutoff logic·폼 동작은 변경하지 않는다.
- [x] **S3-3 Cross-route:** 동일한 남색 배너·영어 eyebrow·흰 카드 외곽을 Evidence/Replay에 반복하지 않는다. `/monitoring`은 변화 목록, Holding은 기록, Evidence는 원문, Replay는 날짜별 결과라는 구성을 유지한다. 공통 서체·간격·focus·모바일 하단 navigation은 유지한다. 새 장식·그림자·기능 없는 아이콘을 추가하지 않는다.
- [x] **S3-4 초보자 문구:** 처음 나오는 `총차입금`에는 `빌린 돈`이라는 쉬운 뜻을 같은 줄에 한 번만 붙인다(예: `총차입금(빌린 돈)`). `Risk State`, `Historical Replay`, `SOURCE CHECK` 같은 내부 용어를 주요 제목으로 쓰지 않고 `현재 확인 상태`, `선택한 날짜까지 공개된 정보`, `공시 원문`처럼 행동·정보가 읽히는 한국어를 쓴다. Replay 제목의 `까지`는 cutoff 이전 자료를 포함한다는 의미이므로 반드시 유지한다. 사실·금액·위험 판단을 새로 만들어 설명하지 않는다. AI 자체를 정보보다 먼저 놓지 않는다.
- [x] Evidence와 Replay의 1440×900·390×844 및 full-page After를 같은 demo fixture로 `design/audit/2026-10-02-redesign/stage-3/`에 저장한다. Before 파일은 덮어쓰지 않는다. Evidence 캡처를 먼저 공유해 Designer의 중간 의견을 받은 뒤 Replay를 마무리한다. build/check:ui/관련 E2E와 원문·재생 동작을 확인해 READY_FOR_REVIEW로 넘긴다. Designer 검수 전 commit/push하지 않는다. PASS 후 Stage 3 변경만 commit/push하고 원격 SHA와 이 디자인 작업에 속한 미커밋 변경 여부를 보고한다.

designer_notes:

2026-10-02 현재 렌더링을 데모 fixture와 Edge 1440/390에서 다시 확인했다. 실제 backend 데이터를 검증한 것은 아니다. 사용자가 3단계 구현과 각 단계 commit/push, 중간 Designer 캡처 검수를 명시적으로 승인했다. 본 Designer 세션은 프로덕션 frontend 코드를 수정하지 않는다. 과거 PASS 내역은 [이전 handoff 기록](design/audit/2026-10-01/handoff-history.md)에 보관했다. 거절된 ledger 시안의 코드·스크린샷은 복원하지 않는다.
2026-10-03 Stage 1 데스크톱·모바일 Before/After를 직접 비교했다. 첫 viewport의 변화·채권·상태·원문 순서는 개선됐고 재무 감소의 오해 유발 색도 사라졌다. QA가 변화 없는 채권에서 아이콘 의미와 주황색 marker 충돌을 재현해 review_round 1의 CHANGES_REQUESTED로 돌린다. 수정 범위는 S1-R1 한 건이며 Stage 2/3은 아직 시작하지 않는다.
2026-10-03 Stage 1 디자인 PASS. S1-R1 재캡처 네 장을 직접 확인했고 QA도 blocker 해소 및 모니터링 비캡처 E2E 36/36 통과를 확인했다. Stage 1에 속한 변경의 commit/push를 승인한다. push 결과를 확인한 뒤 Stage 2 handoff로 전환한다.
2026-10-03 Stage 2 S2-2 해석: SinceBoughtResponse에 사건별 위험 범주 연결 필드가 없음을 확인했다. 이번 UI 개선에서 이를 추정 표시하도록 요구하지 않는다. 현재 상태와 전체 범주 펼침만으로 Stage 2를 검수하고, 데이터가 생기는 별도 제품/API 작업이 승인될 때 사건별 범주를 붙인다.
2026-10-03 Stage 2 디자인 PASS. 동일 한결산업 fixture의 1440×900·390×844 Before/After와 full-page를 직접 비교했다. 모바일 첫 화면에 채권·매수일·최근 사건·실제 날짜·Bonda 현재 상태·원문 버튼이 보이고, 빈 AI 카드·중복 남색 요약판·의미가 검증되지 않은 빨간 증감률은 사라졌다. QA BLOCKER/FOLLOW-UP 없음, build/check:ui/관련 비캡처 E2E 24/24 PASS. Stage 2 변경의 commit/push를 승인한다. `총차입금` 같은 초보자에게 어려운 용어의 쉬운 설명은 Stage 3의 전체 문구 점검에서 다루며 이번 단계를 막지 않는다.
2026-10-03 Stage 3 디자인 PASS. Evidence와 Replay의 1440×900·390×844 및 full-page Before/After를 직접 비교했다. Evidence에서 API 원문 인용이 첫 정보이고, Replay에서 기준일 당시 상태와 첫 사건이 390px 첫 화면에 있다. `선택한 날짜까지` 제목으로 시점 범위가 명확해졌고 총차입금의 첫 노출에는 `빌린 돈`을 덧붙였다. QA BLOCKER 없음, FOLLOW-UP은 이전 Holding mobile Before 파일 손상 1건이다. build/check:ui, Evidence·Replay·route 비캡처 E2E 24/24, Replay cutoff backend 통합 테스트 1/1을 확인했다. Stage 3에 속한 변경의 commit/push를 승인한다.

frontend_notes:

2026-10-03 Stage 3 디자인 PASS 후 승인된 구현·관련 테스트·Evidence/Replay After 8장·handoff만 `1c6197401aa4844eba78b7903126d6a1945b1724`으로 커밋하고 `origin/main`에 push했다(`33d0d2c..1c61974`). staged diff에서 기존 M1–M2 모바일 시트 motion CSS hunk와 `Dialogs.tsx`를 제외했고, `.codex`·`DESIGN.md`·`PLAN.md`·`STATUS.md`·다른 audit/current·reference 자료도 stage하지 않았다. 앞선 승인 Stage 1의 모니터링 route smoke-test 기대값은 같은 `routes.spec.ts`의 Stage 3 경로 테스트 갱신과 함께 포함했다. Stage 1–3의 승인된 핵심 화면 구현과 Stage 3 After 8장은 원격에 있으며, 별도 M1–M2 motion 작업과 기존 디자인 문서·감사 자료는 로컬 미커밋 상태다. 손상된 untracked `design/audit/current/holding-mobile-390.png`는 stage하지 않았다.

2026-10-03 Stage 3 구현 완료·마일스톤 재검토 BLOCKER/FOLLOW-UP 없음. Evidence 중간 검수 PASS 후 Replay의 배너·거대 hero를 제거하고 발행기업/기준일 폼 → API가 돌려준 기준일 당시 상태 → 당시 사건을 우선 배치했다. 디자이너 중간 의견에 따라 제목은 cutoff의 포함 범위를 정확히 전하는 `선택한 날짜까지 공개된 정보`로 수정했다. 390×844 첫 viewport에서 상태와 첫 사건을 직접 확인했고 1440×900 및 full-page와 함께 Stage 3 Replay After 네 장을 저장했다. 총차입금은 Holding·Monitoring·Replay의 첫 노출에만 `(빌린 돈)`을 붙이고 원본 API 텍스트·숫자·위험 계산은 바꾸지 않았다. `DESIGN.md`의 이전 route-command 공통 규칙은 이번 승인된 `DESIGN_HANDOFF.md`의 Evidence/Replay 배너 제거 지시와 충돌하므로 두 경로에 한해 handoff를 적용했다.
검증: 최종 `npm run build` PASS, `npm run check:ui` PASS, Replay 390/1440 캡처·폼/빈 결과 2/2 PASS, 관련 E2E 33 PASS·3 기존 캡처 skip 및 수정 후 route E2E 16/16 PASS, Monitoring/Holding 비캡처 E2E 44 PASS·4 과거 캡처 skip, S3-4 모바일 집중 검증 3/3 PASS, strict premium UI audit 위반 0, `git diff --check` PASS. 기존 screenshot baseline은 자동 갱신하지 않도록 과거 캡처 테스트에 명시적 실행 조건을 추가했다. Reviewer가 첫 검토에서 두 BLOCKER를 지적했고 수정 후 한 번의 재검토에서 모두 해소·FOLLOW-UP 없음으로 확인했다. 최종 Web Designer 검수 전 commit/push하지 않았다.
캡처 검토 과정에서 이전부터 untracked였던 `design/audit/current/holding-mobile-390.png`가 과거 캡처 테스트 실행으로 한 번 덮였다. 추적 중인 `docs/design/` 및 Stage 2 캡처는 원본 blob으로 복원했고 Stage 3 Evidence/Replay Before는 갱신되지 않았다. 해당 untracked Holding 파일의 이전 bytes는 저장소에서 복원할 수 없어 현재 파일을 원본 Before 근거로 사용하지 않는다.

2026-10-03 Stage 3 S3-1 Evidence 중간 재검수 대기: API의 evidenceText를 화면 본문 첫 정보로 배치하고 문서명·공개일·접수번호를 인용문 바로 아래에 두었다. SOURCE CHECK 배너와 큰 문서 제목·중첩 박스를 제거했고 원문 링크·인용문 강조선·검증 메타는 유지했다. 현재 API에 Version 값이 없어 표시하지 않았으며 Web Designer의 지침과 일치한다. 첫 중간 검수 의견에 따라 데스크톱 문서 면을 약 760px 읽기 열로 줄이고 인용문을 18px/28px로 조정했으며 인용 아래 구분선은 한 줄만 남겼다. 390×844의 정보 순서는 유지했다. 1440×900·390×844 viewport 및 full-page 캡처 네 장을 같은 경로에 다시 저장했다. `npm run build`, `npm run check:ui`, Evidence Playwright 2/2 PASS(첫 캡처); 수정 후 Evidence Playwright 2/2 PASS. Replay는 Evidence 재검수 이후 시작한다. Stage 3 전체 테스트 및 READY_FOR_REVIEW는 아직 아니다. commit/push하지 않았다.

2026-10-03 Stage 2 디자인 PASS 이후 승인된 구현·테스트·handoff·Stage 2 캡처 네 장만 `3c27b73e5dc5695a1502e323efa609de28ceff57`으로 커밋하고 `origin/main`에 push했다(`19bcdc2..3c27b73`). 기존 M1–M2 모바일 시트 motion CSS hunk와 앞선 모니터링 route test hunk는 unstaged로 남겼고, `.codex`·`PLAN.md`·`STATUS.md` 및 다른 design 자료도 stage하지 않았다. Stage 3은 시작하지 않았다.
2026-10-03 Frontend Developer Stage 2 구현: 보유 채권의 짧은 identity와 실제 날짜가 있는 최신 사건·Bonda 현재 상태·원문 진입점을 첫 390×844 viewport에 배치했다. `HOLDING PULSE` 배너·큰 질문·중복 남색 요약판을 제거하고, 매수금액을 사건 뒤로 옮겼다. 현재 다섯 범주는 `전체 상태 보기`에 두고 날짜순 기록을 연속 시간축처럼 보이지 않는 목록으로 바꿨다. `NOT_NEEDED` 빈 AI 카드는 렌더링하지 않으며 설명이 있을 때만 접힌 참고 설명으로 제공한다. 재무 값은 기존 금액·부호·기간을 유지한 같은 행의 중립 잉크색 비교로 표시한다. API·backend·금융 계산은 변경하지 않았다.
기존 `SinceBoughtResponse`에는 사건별 위험 범주와 신용등급 전망이 없어 본문에 특정 범주나 전망을 추정해 붙이지 않았다. `currentRiskState`의 현재 Bonda 상태를 최신 사건 옆에 표시하고 범주별 현재 상태는 펼침에 유지했다. Web Designer가 이를 이번 단계의 수용 기준으로 확정했다.
검증: `npm run build` PASS, `npm run check:ui` PASS, Stage 2 Edge Playwright 기본·변화 없음·근거 열기·오류 재시도 3/3 PASS, 관련 route/Stage 2 비캡처 E2E 20/20 PASS. 1440×900·390×844 viewport와 full-page 캡처 네 장을 같은 fixture로 저장해 Before/After를 확인했다. 기존 screenshot baseline은 갱신하지 않았다. 다른 route의 local backend 미기동으로 proxy 경고가 있었으나 E2E는 통과했다. Web Designer의 중간 검수 전 commit/push하지 않았다.
2026-10-03 Stage 1 디자인 PASS 이후 승인된 구현·테스트·handoff·Stage 1 캡처 8장만 `e5d392fddf309b004a97e3c73e8d8e7eab7f9903`으로 커밋하고 `origin/main`에 push했다(`ee8ff8c..e5d392f`). 기존에 미커밋이던 `MonitoringPage.tsx`, `styles.css`, `monitoring.spec.ts`의 이전 승인 D1–D3 변경은 Stage 1 변경과 같은 파일에 공존해 포함됐다. 별도 M1–M2 모바일 시트 애니메이션 CSS hunk와 `Dialogs.tsx`·`routes.spec.ts` 등 다른 미커밋 변경은 stage하지 않았다. push 범위에는 로컬에 이미 있던 `3c6d5f1` 문서 커밋도 포함됐다. Stage 2/3은 시작하지 않았다.
2026-10-03 S1-R1: `unread=0`인 대한항공 101의 모바일 selector·데스크톱 채권 행·사건 요약을 `새로 확인할 변화 없음` 중립 문구로 통일하고, 해당 영역의 변화 도트를 제거했다. 타임라인 선택 marker에는 상태색인 주황 대신 기존 선택 accent를 사용했다. 기본 롯데케미칼 2건과 CJ CGV 3건의 도트·건수는 유지된다. build/check:ui PASS, Stage 1 Playwright 2/2 PASS, monitoring E2E 36/36 PASS. 1440×900·390×844에서 기본 선택과 대한항공 선택을 각각 캡처하고 확인했다. 디자이너 재검수 전 commit/push하지 않았다.
2026-10-03 Frontend Developer Stage 1 구현: `/monitoring`에서 변화 있는 채권을 목록 앞에 두고 변화 없는 채권은 접었다. 검색으로 변화 없는 채권을 찾으면 결과가 보이도록 그룹이 열린다. 기존 선택·검색·추가·탭 동작과 동일 데모 데이터를 유지했다. 모바일 첫 viewport에는 선택 채권, 사건 제목·날짜, Bonda 상태, 공시 원문 버튼이 보인다.
신용등급·전망과 Bonda 계산 상태를 별도 줄로 분리했다. 사건에 이미 존재하는 범주를 연결해 표시하고 다섯 범주는 `전체 상태 보기`로 접었다. 재무 증감률은 부호와 무관하게 중립 잉크색으로 표시하며 기준·현재의 실제 값과 단위를 모두 남겼다. 두 점 비교의 0 기준은 음수 영업현금흐름에서도 유지하고, 기존 임계값이 있는 행에만 임계 tick을 표시한다. 변화 도트는 항상 `새 변화 N건` 텍스트와 함께 쓴다. Backend/API/RiskPolicy/계산 로직은 수정하지 않았다.
검증: `npm run build` PASS, `npm run check:ui` PASS, `npm run test:ui -- tests/monitoring.spec.ts --grep-invert '@capture'` 36/36 PASS, 전체 비캡처 Playwright 52/52 PASS, Stage 1 1440×900·390×844 브라우저 assertion/캡처 1/1 PASS. 390px에서 가로 넘침이 없고 사건·원문 진입점이 첫 viewport에 있다. 다른 route의 기존 local backend 미기동으로 `/api/...` proxy 경고가 있었으나 E2E는 통과했다. 기존 screenshot baseline은 갱신하지 않았다.
작업 시작 시 `MonitoringPage.tsx`, `styles.css`, `monitoring.spec.ts`는 앞선 승인 디자인 작업 때문에 이미 미커밋 수정 상태였다(시작 시 파일 blob hash: `119974ada8c1904e6af81c9eb1f08df187e2819f`, `93050f6d6c8c3017dfbcd562d36ec678b8433a7b`, `29645495150ea4fe1c2efc5b9a730bfaeab671ba`). 이번 Stage 1 변경과 기존 hunks가 같은 파일에 공존한다. 디자이너 검수 전 commit/push하지 않았고, Stage 2/3와 관련 없는 dirty 파일은 건드리지 않았다. Stage 1 최종 디자인 PASS 권한은 Web Designer에게 있다.
