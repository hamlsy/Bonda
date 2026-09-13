# Bonda frontend refinement plan

## 목적과 기준선

이 문서는 디자인 규칙이 아니라 현재 `/monitoring` 화면을 기준으로 수행할
일회성 개선 작업 계획이다. 화면의 정보 구조와 핵심 기능은 보존하고,
AI 생성물처럼 보이는 장식과 과장된 표현을 줄여 신뢰도 높은 초기 금융
스타트업 제품으로 다듬는다.

기준 소스:

- `frontend/mock/bonda_mock_main/src/App.tsx`
- `frontend/mock/bonda_mock_main/src/components`
- `frontend/mock/bonda_mock_main/src/data/mockBonds.ts`

보존할 핵심:

- 좌측 채권 목록과 우측 선택 채권 상세 구조
- 원문 사실, 정량 계산, AI 해석의 세 정보층
- 검색, 등급·위험·만기 필터, 채권 선택, 탭 전환
- 직접 진단 입력과 결과 확인 흐름
- 밀도 높은 신용 지표와 근거 탐색 경험

## 감사 요약

데스크톱 화면은 한 화면에서 종목과 상세를 비교하기 쉽고, 위험 신호가
즉시 보인다. 그러나 같은 중요도를 가진 색면·카드·badge가 지나치게 많아
시선이 분산되고, 신뢰성이 중요한 금융 화면보다 생성형 AI 데모처럼 보인다.

소스 측정치:

- `rounded-xl` 55회, `rounded-2xl` 33회, `rounded-3xl` 2회,
  `rounded-full` 15회
- shadow 계열 46회
- 10px 글자 47회, 11px 글자 49회
- 서로 다른 Tailwind 색상 utility 114종
- gradient 배경 4회

실제 화면 확인 결과:

- 390px viewport에서 문서 폭이 503px가 되어 가로 스크롤이 발생한다.
- 모바일 상단의 검색과 핵심 행동이 잘리거나 숨겨진다.
- 필터 emoji, 색이 채워진 pill, 반복되는 원형 상태점이 의미보다 장식으로
  먼저 읽힌다.
- 직접 진단 dialog는 Escape로 닫히지 않고, 닫기 icon에 접근 가능한 이름이
  없다. focus trap과 닫은 뒤 focus 복귀도 보장되지 않는다.
- `실시간`, `100%`, `오차 0%`, `즉시`, `고위험 경고`, 특정 모델명 등의
  표현이 실제 데이터 계약보다 강한 확신을 준다.
- API 실패 시에도 성공처럼 보이는 toast를 띄우는 경로가 있다.
- 10–11px 보조 문구가 많아 금융 데이터의 가독성과 200% 확대 대응이 약하다.

## 외부 조사로 보강한 판단

`AI slop`은 공식 디자인 표준이 아니라 업계에서 사용하는 휴리스틱이다.
따라서 특정 색이나 radius 하나를 기계적으로 금지하는 대신, 여러 증상이
제품 이유 없이 함께 나타나는지를 판단한다.

- 공개된 [Design Slop Symptom Catalog](https://github.com/wpgaurav/design-slop/blob/main/references/slop-patterns.md)는
  모든 section의 card화, 중첩 rounded card, pill 남용, card마다 shadow,
  border·shadow·tint·glow 중첩, mobile에서 desktop 단순 적층을 대표 증상으로
  분류한다. 현재 Bonda 화면은 이 항목 대부분과 직접 겹친다.
- [USWDS의 색상 지침](https://designsystem.digital.gov/design-tokens/color/overview/)은
  전체 palette에서 임의 색을 계속 꺼내 쓰기보다 역할 기반의 작은 project
  token 집합을 사용하고, 먼저 흑백 위계를 만든 뒤 기능적 의미를 위해 색을
  추가하라고 권장한다. 따라서 단순히 보라색을 다른 색으로 바꾸는 방식은
  채택하지 않는다.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)는 320 CSS px에서 양방향
  스크롤 없이 reflow되어야 하고, 200% 확대에서도 정보와 기능이 유지되어야
  한다. 현재 390px에서 503px 폭이 되는 현상은 취향 문제가 아니라 P0 결함이다.
- [MDN dialog 지침](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)은
  명시적 닫기 수단, 초기 focus, Escape 닫기, modal 바깥 inert 처리를 요구한다.
  현재 custom modal은 이 기본 행동을 충족하지 않는다.
- [OpenAI의 Codex 사용 지침](https://openai.com/business/guides-and-resources/how-openai-uses-codex/)은
  큰 변경 전에 구현 계획을 만들고, GitHub issue처럼 범위·맥락·완료 조건을
  구조화하며, 작은 작업 backlog와 반복 검토를 사용하는 방식을 권장한다.
  따라서 한 번의 광범위한 `더 예쁘게` prompt로 전체 UI를 다시 생성하지 않는다.
- Codex 등 coding agent용 공개 체크리스트인
  [No Slop UI](https://github.com/LeoStehlik/no-slop-ui)는 안정적인 shell,
  제품 크기의 typography, 단색 surface, 제한된 shadow, 6–10px button radius,
  친숙한 table·form·filter·tab 동작과 실제 반응형 검증을 공통 개선점으로
  제시한다. 이 자료는 보조 휴리스틱으로만 사용하고 Bonda의 제품 맥락이
  항상 우선한다.

조사 결과 기존 계획에서 두 가지를 수정한다.

1. `gradient 0`, `card 0` 같은 숫자만으로 품질을 판정하지 않는다. 제품 의미가
   없는 장식은 제거하되, 독립된 객체나 실제 선택 상태처럼 container가 필요한
   곳은 남긴다.
2. Codex의 결과를 prose 규칙에만 의존하지 않는다. 기준 screenshot, 실제
   token code, 상태별 acceptance test와 before/after 비교가 함께 통과해야 한다.

## 목표 방향

`분석 데모`가 아니라 `작은 팀이 만든 믿을 수 있는 신용 모니터링 도구`로
보이게 한다. 흰색과 slate 중립면을 중심으로 두고 indigo는 선택·주요 행동,
emerald는 계산 완료, amber와 rose는 실제 위험 상태에만 사용한다. 세 정보층은
색칠된 대형 카드가 아니라 label, 얇은 rule, icon의 제한된 accent로 구분한다.

화면의 기억점은 장식이 아니라 `채권 선택 → 근거 → 계산 → 제한적 AI 해석`의
빠른 읽기 흐름으로 만든다.

## Codex 작업 방식 보정

Codex의 고질적인 `기능은 되지만 generic한 화면`을 막기 위해 모든 frontend
작업을 다음 순서로 제한한다. 별도 디자인 규정 문서를 다시 만들지 않고,
현재 화면 capture와 실제 source/token을 기준으로 사용한다.

### 작업 입력 형식

각 vertical slice를 GitHub issue 수준으로 작성한다.

- 대상 route와 정확한 화면 상태
- 사용자가 이 slice에서 끝내야 하는 한 가지 일
- 유지할 정보·행동과 수정 가능한 영역
- 참조 screenshot의 viewport와 selected data
- 수정 대상 파일과 재사용할 sibling component
- loading, empty, error, disabled, keyboard, mobile 상태
- 금지할 generic fallback과 허용 가능한 예외의 이유
- 정량 완료 조건과 비교 screenshot 목록

`현대적으로`, `premium하게`, `스타트업처럼`만 단독 요구사항으로 쓰지 않는다.
이 표현은 결과 평가 항목이지 구현 지시가 아니다.

### 생성 전 gate

- 먼저 현재 DOM, source, 실제 screenshot을 읽고 정보 위계를 문장으로 요약한다.
- card를 추가하기 전 `독립적으로 선택·이동·갱신되는 객체인가`를 확인한다.
  아니면 spacing, heading, divider로 그룹화한다.
- 색을 추가하기 전 `브랜드, 선택, 정보층, 위험 상태, focus 중 무엇을
  의미하는가`를 지정한다. 의미가 없으면 neutral을 사용한다.
- icon은 label을 대신하지 않고 식별 속도를 높일 때만 사용한다.
- 새 variant를 만들기 전에 동일 역할의 기존 component와 token을 검색한다.

### 구현과 검토 loop

1. 한 component 또는 한 상태만 수정한다.
2. build와 해당 interaction을 실행한다.
3. 기준과 같은 viewport·채권·탭으로 before/after screenshot을 만든다.
4. 두 화면을 나란히 보고 정보 손실, spacing drift, contrast, 잘림을 검사한다.
5. `회사명과 primary 색을 바꿔도 아무 SaaS에나 맞는가`라는 substitution test를
   수행한다. 그렇다면 Bonda의 공시·등급·만기·근거 관계가 더 드러나도록
   수정한다.
6. 장식 하나를 더하는 대신 불필요한 효과 하나를 제거한 뒤 다시 확인한다.
7. mobile, keyboard와 failure state까지 통과해야 slice를 종료한다.

### 자동 회귀 방지

- semantic token 밖의 새 raw color, 12px 미만 신규 본문, decorative gradient,
  card shadow, emoji action label, clickable `div`를 정적 검사 대상으로 둔다.
- 검사 수치는 회귀 경보일 뿐 디자인 점수가 아니다. 예외는 source 주석에
  제품상의 이유가 있어야 한다.
- visual regression은 1280px, 768px, 390px와 overview/raw/metrics/AI/timeline,
  modal open 상태를 포함한다.
- 화면 완료 보고에는 변경 파일뿐 아니라 before/after capture, keyboard 결과,
  overflow 수치와 남은 미연동 상태를 포함한다.
- 첫 번째 개선 slice가 승인된 뒤에만 `AGENTS.md`에 긴 취향 문서 대신
  `기준 route`, `canonical component/token 경로`, `필수 viewport`,
  `visual comparison 명령`처럼 Codex가 코드에서 추론하기 어려운 사실만 짧게
  추가한다. 아직 승인되지 않은 미적 취향을 영구 규칙으로 고정하지 않는다.
- 상단 shell이나 bond row처럼 파급이 큰 변경은 바로 한 안을 확정하지 않고
  같은 데이터와 viewport로 2개 이하의 작은 대안을 비교한 뒤 하나만 구현한다.
  이는 OpenAI가 복잡한 문제에서 여러 결과를 검토하는 `Best of N` 방식을
  권장하는 취지를 좁은 UI 의사결정에 적용한 것이다.

## 실행 순서

### 1. 기준선 고정과 컴포넌트 정리

- 현재 desktop, 390px mobile, overview, raw facts, metrics, AI insights,
  timeline, 두 dialog 상태를 visual baseline으로 저장한다.
- mock source를 실제 `frontend/src`의 유지보수 가능한 컴포넌트로 이동한다.
- 반복되는 button, status label, panel, tab, dialog 스타일만 얇은 공통
  primitive로 추출한다. 계층을 과도하게 늘리지 않는다.
- 더미 데이터와 화면 컴포넌트를 분리해 이후 API 교체가 가능하게 한다.
- source에서 semantic token module을 먼저 만들고 이후 색·spacing·radius 변경은
  그 token을 통해서만 적용한다. 별도 디자인 문서를 새로운 source of truth로
  만들지 않는다.

완료 조건: 기능과 정보 순서가 현재 화면과 동일하고, 각 상태의 비교
스크린샷이 준비되어야 한다.

### 2. 신뢰 문구와 브랜드 정합성

- `BondCredit AI`를 제품명 `Bonda`로 통일한다.
- `Gemini 3.8`처럼 공급자와 버전에 종속된 표시는 사용자 가치 중심의
  `AI 참고 해석`으로 바꾼다.
- `실시간`, `100%`, `오차 0%`, `즉시`, 확정적 투자 행동 지시를 실제
  backend 계약이 증명하는 표현으로 낮춘다.
- 더미·미연동 행동에는 `데모 데이터`, `저장되지 않음`, `연동 준비 중`을
  결과 가까이에 명시한다.
- 요청 실패를 성공 메시지로 바꾸지 않고 오류와 재시도를 제공한다.

완료 조건: 실제 제공하지 않는 실시간성, 정확성, 저장, 발송, 투자 추천을
암시하는 문장이 없어야 한다.

### 3. 색상과 표면 감량

- 색상 utility를 semantic 역할 7개 이내로 수렴한다: canvas, surface,
  text, muted, line, primary, risk states.
- 로고와 section 배경의 gradient를 제거하고 단색 또는 약한 중립 대비로
  교체한다.
- 원문·계산·AI 영역의 indigo·emerald·violet 대형 채움은 제거하고 제목
  accent와 상태 label에만 남긴다.
- radius를 small/medium 두 단계로 제한하고, badge가 아닌 panel에는 pill을
  사용하지 않는다.
- shadow는 sticky navigation과 열린 dialog에만 남기며 card 구분은 border와
  spacing으로 처리한다.
- emoji 상태표시는 Lucide icon과 텍스트 상태명으로 교체한다.

완료 조건: decorative gradient 0개, 장식 emoji 0개, 일반 본문 card shadow
0개를 기본 목표로 한다. 독립 객체·선택·위험 상태에 필요한 container와 색은
근거를 확인하고 남기며, 색만으로 상태를 구분하지 않아야 한다.

### 4. 정보 위계와 밀도 재조정

- 상단 navigation과 3대 원칙 bar의 중복을 줄여 첫 데이터 행을 더 위로
  올린다.
- 검색은 항상 접근 가능하게 하고 주요 행동은 `채권 추가` 하나만 primary로
  둔다.
- 필터는 emoji pill 모음 대신 compact segmented/filter control로 바꾼다.
- 좌측 채권 row에서 이름, 등급·전망, 핵심 수익률, 최신 위험 신호 순으로
  읽히게 하고 반복 지표를 줄인다.
- 우측 header는 등급, 만기, YTM, spread를 한 줄의 비교 가능한 data strip으로
  정리한다.
- overview의 세 정보층은 같은 높이의 홍보 카드가 아니라 중요도에 맞는
  evidence summary로 바꾼다.
- 기본 보조 글자 크기를 12px 이상, 주요 수치와 본문을 14–16px로 맞춘다.

완료 조건: 첫 viewport에서 선택 종목, 핵심 상태, 최신 근거와 주요 탭이
동시에 보이고, 동일 의미가 두 번 이상 반복되지 않아야 한다.

### 5. 반응형 구조 수정

- 390px에서 `scrollWidth === innerWidth`가 되도록 고정 폭과 최소 폭을 제거한다.
- mobile은 `목록 → 선택 채권 요약 → 상세 탭`의 document flow로 전환한다.
- 상단 검색, 필터, 채권 추가를 mobile에서도 숨기지 않고 압축 배치한다.
- 가로로 긴 탭은 scroll 가능한 tab list 또는 선택 menu로 제공하되 현재
  위치와 나머지 항목의 존재가 보이게 한다.
- 금융 수치와 원문은 잘라내지 않고 줄바꿈·expand로 전체 값을 확인하게 한다.

완료 조건: 320px, 360px, 390px, 768px, 1280px와 200% 확대에서 문서 가로
스크롤, 잘린 행동, 겹친 텍스트가 없어야 한다. 금융 표처럼 2차원 탐색이
본질적인 영역만 내부 horizontal scroll을 허용하고 그 사실을 시각적으로
알린다.

### 6. 상호작용과 접근성 보강

- 채권 row의 clickable `div`를 실제 `button` 또는 탐색 link로 바꾼다.
- 검색에 label과 clear button을 제공하고 필터 결과 0건 상태에 초기화 행동을
  둔다.
- tab에 `tablist`, `tab`, `tabpanel`, 선택 상태와 화살표키 동작을 적용한다.
- dialog에 이름 있는 닫기 button, 초기 focus, focus trap, Escape 닫기,
  background inert/scroll lock, trigger focus 복귀를 구현한다.
- form은 native validation bubble 대신 inline error와 첫 오류 focus를 사용한다.
- hover, focus-visible, active, disabled, busy 상태를 공통으로 정의한다.
- motion은 상태 이해에 필요한 경우만 남기고 reduced-motion을 지원한다.

완료 조건: keyboard만으로 검색, 필터, 채권 선택, 모든 탭, dialog 입력과 닫기가
가능하며 WCAG 2.2 AA contrast를 충족해야 한다.

### 7. 실제 API 재연결

- 더미 데이터 adapter와 API adapter가 같은 view model을 반환하게 한다.
- 기존 bond, holding, watchlist, alert, since-bought, risk-event API를 새 main
  구조에 작은 vertical slice로 다시 연결한다.
- loading, empty, no-result, stale, partial error, mutation pending/success/failure
  상태를 먼저 만들고 기능을 연결한다.
- 시장가격, YTM, 외부 알림, 인증, 결제처럼 API가 없는 값은 demo임을 표시하고
  후속 backend 항목으로 유지한다.

완료 조건: 화면상 실제 데이터와 demo 데이터의 출처가 구분되고, 실패가
성공으로 표시되지 않아야 한다.

### 8. 랜딩과 상세 route 확장

- `/monitoring` 개선이 승인된 뒤 같은 색상·타입·shape만 `/`에 확장한다.
- 기존 since-bought, risk-event, replay 화면은 기능별로 하나씩 새 shell에
  옮긴다.
- 모든 화면을 한 번에 재작성하지 않고 route 단위 vertical slice로 배포한다.

## 권장 작업 단위

1. P0: 신뢰 문구, 오류 성공 처리, 모바일 가로 overflow, dialog keyboard.
2. P1: 색상·gradient·shadow·radius·emoji 감량과 typography 정상화.
3. P1: navigation, filter, bond row, header, overview 정보 위계 재편.
4. P2: tabs, empty/loading/error states, API adapter 연결.
5. P2: landing과 보존된 상세 route에 승인된 표준 확장.

각 작업 단위는 독립 build, desktop/mobile screenshot 비교, keyboard 검사 후
다음 단계로 넘어간다. 현재 화면의 기능이나 정보가 사라지는 시각 개선은
완료로 간주하지 않는다.

## 최종 승인 질문

각 slice는 다음 질문에 모두 `예`일 때만 승인한다.

- 이 선택은 Bonda의 회사채 신용 모니터링이라는 맥락에서 나온 것인가?
- 사용자는 위험 결론보다 근거와 기준일을 먼저 확인할 수 있는가?
- 실제 기능, 더미 기능, AI 해석이 외형과 문구로 구분되는가?
- 색과 container를 제거해도 정보 관계가 typography와 정렬로 남는가?
- 320px, keyboard, 200% 확대에서 같은 일을 끝낼 수 있는가?
- API 실패나 미연동 상태를 성공처럼 보이게 하지 않는가?
- before/after 비교에서 정보 손실 없이 장식과 인지 부담이 줄었는가?

## 2026-09-13 실행 결과

완료된 vertical slice:

1. mock 화면을 `/monitoring`과 `/`의 실제 렌더링 기준으로 채택했다.
2. `/monitoring`에서 데모와 실제 기능을 구분하고, 존재하지 않는 AI API의 실패를
   성공으로 표시하던 fallback을 제거했다.
3. gradient, 장식 emoji, 일반 카드 shadow, 과도한 radius와 색 면적을 줄이고
   indigo는 선택·주요 행동, emerald는 계산, amber/rose는 위험 상태에 제한했다.
4. 10–11px 보조 글자를 렌더링 단계에서 12px 이상으로 보정하고, 전역 button
   규칙과 Tailwind utility가 충돌하던 cascade layer 문제를 해결했다.
5. 모바일 header, 검색, 필터, 목록, 상세 탭의 가로 overflow를 제거했다.
6. 검색 초기화, 0건 상태 복구, native button 채권 row, tab ARIA와 화살표키,
   native dialog, Escape, focus 복귀, 인라인 form error를 구현했다.
7. 랜딩의 과장된 실시간·24시간·100% 문구를 데모/연동 예정 문구로 바꾸고
   메인 화면과 같은 shape·색상 기준으로 정리했다.
8. `npm run check:ui`에 과장 신뢰 문구, 장식 gradient·emoji, clickable div의
   재유입을 막는 정적 guardrail을 추가했다.

검증 결과는 루트의 `design-qa.md`에 기록한다.

후속 개발 항목:

- 실제 bond/holding/watchlist/risk-event API를 동일 view model adapter에 route별로
  연결한다.
- 연결 slice마다 loading, stale, partial error, retry, mutation pending 상태를 먼저
  추가한다.
- 인증, 결제, 카카오 알림, 외부 시장가격, 실제 AI 분석은 backend 계약이 생기기
  전까지 `데모` 또는 `예정` 표기를 유지한다.
- 보존된 since-bought, risk-event, replay route는 API slice와 함께 현재 shell로
  하나씩 옮긴다.
