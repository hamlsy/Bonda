# Bonda frontend refinement plan v2.2

작성일: 2026-09-14

상태: **조건부 승인**. Phase 0은 시작할 수 있지만, 전체 restyling은 Gate 1의 시안
선택과 데이터 계약 확인 전에는 시작하지 않는다.

## 1. 결론

현재 Bonda는 1차 정리로 모바일 가로 넘침과 일부 과장 표현을 줄였지만, 아직
`신뢰할 수 있는 회사채 신용 모니터링 도구`보다 `생성형 AI가 만든 핀테크 데모`
쪽에 가깝다. 냉정하게 말하면 개선 완료 상태가 아니다.

가장 큰 문제는 보라색이나 둥근 모서리 하나가 아니다.

- 제품의 핵심 질문인 `매수 뒤 무엇이 달라졌는가`보다 카드와 탭이 먼저 보인다.
- 정량 탭에도 차트가 없고 숫자 카드만 반복된다.
- 사실, 계산, AI 해석이 색만 다를 뿐 같은 카드 문법으로 표현된다.
- 모바일은 데스크톱을 한 줄로 줄인 화면에 가깝고, 목록을 지나야 상세를 볼 수 있다.
- 런타임 UI의 canonical owner가 mock 소스와 실제 소스 두 갈래로 나뉘어 있다.
- 부드러움이 필요한 상태 전환은 거의 없고, `transition-all`과 위험 점 pulse처럼
  장식적인 움직임만 남아 있다.

이번 개선의 목표는 `캐주얼한 AI 대시보드`를 `개인투자자를 위한 소형 크레딧
리서치 워크스테이션`으로 바꾸는 것이다. 정보량을 줄이는 작업이 아니라, 변화·근거·
기준일의 관계를 그래프와 정렬로 먼저 이해하게 만드는 작업이다.

여기에 한 가지 요구를 명시적으로 추가한다. **시각적 매력은 장식이 아니라 신뢰와
사용 의지를 만드는 제품 요구사항**이다. 다만 아름다움이 실제 사용성을 대신한다고
가정하지 않는다. Bonda는 아래 두 gate를 각각 통과해야 한다.

1. `Desirability gate`: 첫인상에서 정교하고 신뢰할 만하며 계속 사용하고 싶어 보인다.
2. `Usability gate`: 핵심 변화·기준·근거를 더 빠르고 정확하게 찾을 수 있다.

예쁘지만 정보가 안 읽히는 시안, 사용은 되지만 무료 AI template처럼 보이는 시안은
둘 다 탈락이다.

마지막 냉정 검토에서 이전 v2.1의 세 가지 오류를 바로잡았다.

- `Credit Desk`를 그대로 밀면 개인투자자용 제품이 기관 terminal의 jargon과 과밀도를
  흉내 낼 위험이 있었다. 전문성은 높은 밀도가 아니라 설명 가능한 위계로 정의한다.
- 현재 API만으로 category별 과거 risk state step line을 만들 수 없는데 가능한 것처럼
  적었다. 구조화되지 않은 `summary`를 frontend에서 해석해 chart로 만들지 않는다.
- 3–5명의 7점 중앙값에 고정 threshold를 두는 것은 작은 표본을 정량 검증처럼 보이게
  한다. 점수는 방향 비교에만 사용하고 task evidence와 관찰 이유를 함께 기록한다.

## 2. 제품 문서에서 다시 확정한 원칙

Source of truth는 `docs/PRODUCT.md`와 `docs/IMPLEMENTATION_SPEC.md`다.

사용자가 끝내야 하는 일은 다음 순서다.

1. 보유 또는 관심 채권 중 새 변화가 있는 대상을 찾는다.
2. 매수일 이후 언제, 어떤 위험 category가 변했는지 확인한다.
3. 그 변화의 원문과 deterministic 계산 근거를 검증한다.
4. AI 설명은 마지막에 제한적인 참고 해석으로 읽는다.

따라서 화면의 우선순위도 `AI 리포트 → 예쁜 카드`가 아니라
`변화 감지 → 시계열 → 임계치 → 원문 근거 → 참고 해석`이어야 한다.

현재 API가 증명하는 값만 정식 시각화에 사용한다. 시장가격, YTM, 스프레드 이력처럼
backend 계약에 없는 값은 정식 데이터처럼 그래프에 그리지 않는다. mock에서 보여줄
경우 차트 가까이에 `샘플 데이터`와 데이터 범위를 표시한다.

## 3. 감사 범위와 화면별 상태

2026-09-14에 현재 코드를 실행해 다음 상태를 확인했다.

| 단계 | 확인 화면 | 상태 | 판정 |
|---|---|---|---|
| 1 | `/` desktop landing | 렌더링 성공 | 구조적 개선 필요 |
| 2 | `/monitoring` desktop overview | 렌더링 성공 | 구조적 개선 필요 |
| 3 | `/monitoring` 정량 지표 | 렌더링 성공 | 핵심 시각화 부재 |
| 4 | `/monitoring` 위험 신호·타임라인 | 렌더링 성공 | 카드 목록에 머묾 |
| 5 | 직접 진단 dialog | 렌더링·접근성 이름 확인 | 시각 밀도 개선 필요 |
| 6 | `/monitoring` 390px | 문서 가로 넘침 없음 | 목록 우선 구조가 비효율적 |
| 7 | `/monitoring` 320px | 문서 폭 320px 유지 | 중첩 스크롤·과밀·텍스트 버튼 문제 |

스크린샷만으로 색 대비, 모든 키보드 순서, screen reader 발화와 200% 확대 적합성을
완전히 증명할 수는 없다. 구현 단계에서 자동 검사와 실제 조작 검증이 필요하다.

## 4. 문제점별 냉정한 진단

### 4.1 너무 캐주얼하고 전문성이 약하다

확인한 증상:

- 랜딩은 중앙 정렬 대형 hero, 작은 eyebrow pill, 보라색 강조 단어, 나란한 2개 CTA,
  아이콘 4개짜리 trust row로 구성된다. 전형적인 AI SaaS 랜딩 문법이다.
- 모니터링은 header, 3대 원칙, 필터, 채권 row, 상태 badge, 탭, overview의 3열 카드가
  모두 비슷한 시각 무게를 갖는다. 사용자가 어디부터 읽어야 하는지 결정하지 않는다.
- 선택 채권 header 위에 큰 빈 공간이 남고, 첫 viewport의 정보 효율이 낮다.
- source 기준으로 `rounded-2xl` 32회, `rounded-xl` 47회, shadow 계열 32회,
  `text-[10px]` 38회, `text-[11px]` 42회, `transition-all` 14회다. 전역 override로
  일부 결과만 눌렀을 뿐 컴포넌트의 원래 설계 문법은 그대로다.
- `부도 리스크는 실질적으로 차단`, `확정 수취`, `만기보유 적합` 같은 mock AI 문구는
  제품 문서가 금지한 인과 단정·부도 예측·투자 추천과 충돌한다. 데모라는 badge가 이
  신뢰 문제를 상쇄하지 못한다.

판정: `스타일 조정 부족`이 아니라 `제품 정보 구조와 카피 책임의 실패`다.

### 4.2 그래프와 도표가 핵심이 아니다

확인한 증상:

- 현재 monitoring bundle에는 chart library, `<svg>`, `<canvas>` 기반 데이터
  시각화가 없다.
- 정량 탭은 ICR, D/E, Net debt/EBITDA 등을 큰 숫자 카드로만 보여준다. 현재값과
  기준선을 한눈에 비교할 수 없다.
- 타임라인은 시간축이 아니라 세로 카드 목록이다. 변화의 간격, 방향, category 간
  동시 발생을 읽기 어렵다.
- overview의 원문·계산·AI 3열은 제품 원칙 설명에는 유용하지만 매일 쓰는 모니터링
  기본 화면으로는 공간 비용이 크다.

판정: 사용자가 요청한 `그래프 및 도표 위주`와 현 상태의 간극이 가장 크다.

### 4.3 모바일은 축소판이지 모바일 작업 흐름이 아니다

확인한 증상:

- 320px에서 검색창은 288×40px, `추가`는 78×40px이다. 텍스트는 줄었지만 작은
  utility action을 아이콘 중심으로 재설계한 것은 아니다.
- 원문 사실·정량 지표·AI 해석 control은 각각 약 92×46px인데, 좁은 폭에서 글자가
  두 줄로 깨진다.
- 채권 row 하나가 약 240px 높이이고, 목록 panel 안에 별도 세로 스크롤이 있다.
  사용자는 작은 화면에서 목록을 스크롤한 뒤 다시 문서를 스크롤해야 한다.
- 상세는 목록 아래에 있어 선택 결과가 즉시 보이지 않는다. filter와 tab은 가로
  scroll에 의존하지만 더 많은 항목이 있다는 신호가 약하다.
- 상태, 등급, outlook, YTM, 쿠폰, spread, 이벤트, 원문 건수, ICR, 잔여일을 한
  row에 모두 보존해 핵심 변화가 오히려 묻힌다.

판정: overflow 버그는 줄었지만 모바일 UX는 아직 통과가 아니다.

### 4.4 animation은 체계가 아니라 산발적 효과다

확인한 증상:

- 대부분 `transition-all` 또는 단순 hover color이고 duration/easing token이 없다.
- 위험 상태에 `animate-pulse`를 사용한다. 지속적인 pulse는 중요도를 높이기보다
  불안과 시각 피로를 만든다.
- 탭 전환, 필터 결과 갱신, 채권 선택, 차트 값 변화, 근거 펼침처럼 상태 이해에
  도움되는 순간에는 연결 motion이 없다.
- `prefers-reduced-motion` override는 존재한다. 이 부분은 유지할 장점이다.

판정: animation 개수를 늘리면 안 된다. 상태 관계를 설명하는 motion system으로
교체해야 한다.

### 4.5 유지보수 구조가 시각 품질을 계속 무너뜨린다

- `/`와 `/monitoring`은 `frontend/mock/...` 앱을 직접 lazy import한다.
- 실제 frontend에는 별도 `DemoMonitoring.tsx`, `SinceBoughtPage.tsx`,
  `RiskEventPage.tsx`, `HistoricalReplayPage.tsx`와 2,000줄이 넘는 `styles.css`가 있다.
- `mock-tailwind.css`는 `[class*="shadow-"]`, `[class*="rounded-2xl"]`,
  `[class*="text-[10px]"]` 같은 문자열 override로 mock의 시각을 사후 보정한다.
- 이 방식은 source와 렌더링 결과가 다르고 새 컴포넌트가 어느 체계를 따라야 하는지
  불명확하다.

판정: 이중 디자인 시스템을 해소하지 않고 시각 개선을 시작하면 다시 같은 문제가
생긴다. 첫 vertical slice에서 canonical owner를 하나로 정해야 한다.

### 4.6 정적 production UI audit도 통과하지 못한다

Frontend Design Premium strict audit 결과는 `11 errors`다.

- native date/select의 소유 방식 미결정 5건
- 목적지가 없는 빈 hash link 1건
- `noValidate`와 app validation contract가 없는 form 4건
- canonical resize rule이 없는 textarea 1건

이 항목은 취향 문제가 아니라 false affordance, 일관되지 않은 validation, 브라우저별
UI drift 위험이다. 각 route는 시각 개편 전에 자신이 소유한 error를 먼저 해결하고,
전체 확장 완료 전에는 project strict audit 0 error를 달성한다. `/monitoring` slice가
landing과 replay의 오류까지 해결한 것처럼 완료 처리하지 않는다.

### 4.7 검증 계획을 실행할 기반이 없다

- project-root에 `DESIGN.md`와 `UX-CONTRACT.md`가 없다.
- `frontend/package.json`에는 `build`, `check:ui`만 있고 browser interaction,
  accessibility, screenshot regression을 재현하는 test script가 없다.
- 따라서 현재 상태에서 `keyboard 확인`, `screenshot diff`라고만 적으면 사람마다 다른
  수동 확인으로 끝나며 회귀를 막지 못한다.

판정: 정적 guardrail은 유지하되, `/monitoring`의 핵심 task와 고정 viewport를 실행하는
최소 browser harness가 필요하다. 이 목적에는 `@playwright/test` dev dependency 하나가
합리적이다. 단순히 예쁜 screenshot을 생성하는 용도로 끝내지 않고 navigation, focus,
dialog, mobile sheet, reduced motion과 데이터 상태를 같은 fixture로 검증한다.

## 5. 인터넷 커뮤니티 조사에서 가져온 방법

`AI slop`은 공식 표준이 아니라 커뮤니티 휴리스틱이다. 특정 radius나 색 하나를
금지하는 방식으로는 해결되지 않는다. 반복적으로 나온 핵심은 `맥락 없는 안전한
기본값`, `증거 없는 완료 선언`, `vague prompt`다.

- [Design Slop symptom catalog](https://github.com/wpgaurav/design-slop/blob/main/references/slop-patterns.md)는
  모든 section의 card화, 중첩 rounded container, pill 남용, card별 shadow,
  mobile의 단순 적층을 대표 증상으로 정리한다.
- [No Slop UI](https://github.com/LeoStehlik/no-slop-ui)는 실제 product screen을 먼저
  만들고, decorative gradient·fake metric grid·oversized radius·vague SaaS copy를
  checklist로 차단하며 build 후 review verdict를 요구한다.
- [Reddit의 web design 논의](https://www.reddit.com/r/webdesign/comments/1uhuovu/preventing_the_ai_slop_look/)에서
  반복된 결론은 둥근 모서리 자체보다 제품 맥락이 없는 동일한 hero, lozenge,
  gradient, 3-card section과 지나치게 친절한 문구가 더 큰 신호라는 것이다.
- [AI coding agent 사용자의 논의](https://www.reddit.com/r/vibecoding/comments/1uwajeo/how_do_you_make_aigenerated_ui_not_look_like_ai/)는
  `premium하게` 같은 형용사 대신 type scale, spacing, button/card rule, color role,
  density, reference, 금지 항목을 수치로 주라고 권한다.
- [AI UI 제작 경험 공유](https://www.reddit.com/r/vibecoding/comments/1s69jbr/create_ui_designs_that_dont_look_aigenerated/)와
  [UI/UX workflow 논의](https://www.reddit.com/r/vibecoding/comments/1s9ecsu/how_to_uiux/)에서
  공통적으로 나온 방법은 screenshot을 그대로 복제시키는 것이 아니라 먼저 색,
  typography, spacing, surface, animation 규칙을 추출해 작은 design system으로
  만든 뒤 모델에 reference와 규칙을 함께 주는 것이다.
- [DESIGN.md 사례 모음](https://github.com/abhayjnayakk/awesome-design-md)은
  `modern SaaS`, `clean dashboard`, `make it beautiful` 같은 모호한 지시가 결과를
  비슷하게 만든다고 지적하고 color role, type, layout, depth, do/don't를 지속되는
  context로 고정한다.
- [fintech UI 피드백](https://www.reddit.com/r/UI_Design/comments/1tpu2gs/uiux_feedback_does_this_new_finance_platform/)에서는
  soft card, gradient, 경쟁적으로 강조된 AI action이 금융 제품을 일반 SaaS처럼
  보이게 하며, restraint, 비교 가능한 데이터, 갱신 시점이 신뢰에 더 유효하다는
  의견이 반복된다.
- [finance dashboard 피드백](https://www.reddit.com/r/UI_Design/comments/1tc2t3f/my_dashboard/)은
  모바일에서 모든 정보를 보존하거나 모든 action을 icon화하면 오히려 복잡해지므로
  progressive disclosure와 선택적인 icon 사용이 필요하다고 지적한다.
- [Hacker News의 금융 시각화 논의](https://news.ycombinator.com/item?id=41088013)와
  [정보 밀도 논의](https://news.ycombinator.com/item?id=40428386)는 금융 도구에서
  `여백이 많은 깨끗한 카드`보다 domain에 맞는 custom chart와 유용한 정보 밀도가
  더 큰 가치가 될 수 있음을 보여준다.
- [NN/g의 첫인상 연구 정리](https://www.nngroup.com/articles/first-impressions-human-automaticity/)는
  첫인상이 미감·사용성·신뢰 평가에 영향을 주지만, 과도한 색·font·눈에 띄는 motion은
  오히려 신뢰를 떨어뜨릴 수 있다고 정리한다.
- [Google의 beauty/usability 연구 소개](https://research.google/blog/is-beautiful-usable-what-is-the-influence-of-beauty-and-usability-on-reactions-to-a-product/)는
  아름다움이 실제 사용성 문제를 자동으로 상쇄한다는 단순한 결론을 경계한다.
- [Superloopy](https://github.com/beefiker/superloopy)는 plan → act → screenshot evidence
  → gate loop를 사용하고, frontend 완료를 desktop/mobile/interaction evidence로
  증명한다.

커뮤니티 의견은 정량 연구가 아니며 그대로 제품 규칙으로 채택하지 않는다. 여러
출처에서 반복되는 pattern을 가설로 삼고, Bonda의 실제 화면과 사용자 과제로
검증한다.

Bonda에 적용할 방법:

1. `전문적으로`, `있어 보이게`라는 prompt로 Codex가 미감을 처음부터 발명하게 하지
   않는다. 먼저 Bonda의 사용자, 과업, 데이터, 금지 카피를 고정한다.
2. 전체 site를 모방하지 않고 component 단위 reference board를 만든다. `밀도·계층 2`,
   `금융 chart 2`, `mobile composition 2`, `typography 1`, `motion 1`을 수집하고 각
   reference마다 `가져올 원리`와 `복제하지 않을 표현`을 기록한다.
3. reference에서 color role, type scale, spacing rhythm, grid, radius, depth, icon,
   chart, motion을 추출해 임시 design system을 만든다.
4. 같은 실제 Bonda 데이터와 copy를 사용한 3개의 desktop/mobile visual
   direction을 image mockup으로 먼저 만든다. 예쁜 placeholder나 가짜 KPI로 시안을
   좋게 보이게 하는 행위를 금지한다.
5. 사람의 5초 첫인상 평가와 핵심 task 평가로 한 방향을 선택한다. 선택 전에는 palette,
   font, radius를 production code에 대규모로 반영하지 않는다.
6. 선택한 방향만 `DESIGN.md`에 고정하고 아래 화면 계약, chart map, mobile 규칙,
   motion token을 Codex의 구현 입력으로 사용한다.
7. 한 route·한 상태 단위로 구현하고 같은 데이터·viewport의 before/after를 비교한다.
8. build 성공을 디자인 완료로 취급하지 않는다. 캡처, keyboard, overflow, reduced
   motion과 접근 가능한 chart 대체 정보까지 evidence로 남긴다.
9. Superloopy 설치 자체는 필수가 아니다. 현재 frontend/audit workflow에 같은
   evidence gate를 적용한다. 자동 반복이 실제 병목이 될 때만 별도 도입한다.

## 6. 시안 선택 전 목표 방향: Credit Desk

`Credit Desk`는 확정 theme이 아니라 시안의 품질을 판단할 product posture다. 아래
색과 표현은 **검증할 가설**이며, 사용자 선택 없이 최종 디자인으로 간주하지 않는다.

### 6.1 미감

`소비자용 자산관리 앱`의 과도한 친근함과 `기관 terminal`의 과밀함 사이에서,
개인투자자가 전문 용어를 학습하지 않아도 읽을 수 있는 `신용 리서치 데스크`로 만든다.

- 표면은 흰 종이와 회색 canvas 중심으로 사용한다.
- 브랜드색은 선택, focus, primary action에만 사용한다.
- 위험색은 검증된 Risk State와 threshold 초과에만 사용한다.
- card보다 grid, rule, aligned column, sticky header로 관계를 만든다.
- 영문 eyebrow와 괄호 속 영문 반복을 줄이고 한국어를 주 label로 사용한다.
- 숫자는 tabular numeral을 사용하고 단위·기준일을 항상 가까이 둔다.

### 6.2 시안이 반드시 해결할 semantic color role

시안 선택 전에 hex 값을 canonical token으로 고정하지 않는다. 모든 방향은 아래 역할을
서로 구분하고 contrast를 검증해야 한다.

- Ink: 본문, 제목, 주요 숫자
- Canvas와 Surface: 앱 배경과 실제 작업면
- Rule: 행, 축, divider
- Control: 선택, focus, primary action
- Risk states: NORMAL, WATCH, CAUTION과 미산정

Risk 색 하나로 위험 수준 전체를 표현하지 않는다. 상태는 텍스트, 아이콘, 선 모양과
명도 차이를 함께 사용한다. 선택된 방향의 4–6개 실제 값만 `DESIGN.md`와 runtime
token에 함께 기록한다.

### 6.3 typography

- 한국어 제목·본문·UI role을 먼저 정의하고 후보 font의 Windows/Android/iOS 렌더링,
  숫자 glyph, font loading 비용을 시안에서 비교한다.
- 숫자·날짜는 `tabular-nums`를 사용하되 무조건 monospace로 만들지 않는다. monospace는
  ISIN이나 source identifier처럼 code 성격이 있는 값에만 후보로 사용한다.
- 본문 최소 14px, 보조 정보 최소 12px, line-height 1.45 이상
- 10–11px 신규 text utility 금지
- 새 web font dependency는 실제 asset·license·성능 근거가 있을 때만 도입

### 6.4 기억점

Bonda의 1차 signature는 장식이 아니라 `근거 연결형 사건 연대기`다. 시점 위의
각 사건을 선택하면 같은 위치에서 사건 종류, 공개 시점, DART 원문 근거가 펼쳐진다.
category별 `이전 상태 → 현재 상태`가 구조화된 API로 제공된 뒤에만 이를 신용 변화선으로
확장한다. AI 설명은 연대기나 상태를 바꾸지 않고 오른쪽 또는 아래의 별도 참고 영역에만
붙는다.

### 6.5 `있어 보임`의 구체적 정의

시각 품질은 효과 개수가 아니라 아래 8개 축으로 평가한다.

| 평가축 | 좋은 상태 | 즉시 탈락 신호 |
|---|---|---|
| 첫인상 | 5초 안에 금융 monitoring 도구와 우선 위험이 보임 | 일반 SaaS landing으로 보임 |
| hierarchy | 제목보다 변화·숫자·근거가 우선됨 | 모든 card가 같은 무게 |
| typography | 숫자, 단위, 날짜, label의 위계가 정교함 | 임의 font size와 tiny label |
| data storytelling | chart가 비교·방향·기준선을 설명함 | 의미 없는 sparkline과 KPI 장식 |
| material | surface와 divider가 구조를 설명함 | shadow·blur·gradient로 고급감 연출 |
| distinctiveness | Bonda의 근거 연결형 변화선이 기억남 | logo를 지우면 아무 AI SaaS와 동일 |
| mobile | 밀도와 우선순위를 재구성함 | desktop card 단순 적층 |
| motion | 상태 관계와 continuity를 설명함 | stagger, pulse, hover scale 남용 |

내부 acceptance 기준은 다음과 같다. 점수는 self-review가 아니라 캡처를 본 사람의
방향 비교 자료로만 수집한다.

- 현재 화면과 후보 시안을 무작위 순서로 보여주고 `신뢰감`, `전문성`, `시각적 매력`,
  `정보가 잘 정리돼 보임`을 7점으로 평가한 뒤 반드시 선택 이유를 한 문장으로 받는다.
- 5초 노출에서는 product category, 선택된 채권, 가장 주의할 정보가 무엇으로 보였는지만
  확인한다. 원문 근거 탐색처럼 읽기와 조작이 필요한 일을 5초 test에 섞지 않는다.
- 별도 task test에서 `변화가 있는 채권 찾기 → 무엇이 언제 변했는지 확인 → 원문 열기`를
  수행하고 성공 여부, 막힌 지점, 조작 수를 기록한다. 예쁜 시안이라도 핵심 task가
  현재보다 나빠지면 탈락한다.
- 가능하면 최근 1년 안에 회사채 또는 채권형 상품을 확인해 본 개인투자자 3–5명에게
  방향성 평가를 받는다. 이 표본은 통계적 유의성을 주장하지 않는다.
- 모집이 어렵다면 제품 owner의 방향 선택과 독립 screenshot critique를 남기고
  `사용자 검증 전` 위험으로 명시한다. 임의의 5/7 threshold로 검증을 가장하지 않는다.

### 6.6 시각 시안 3안의 공통 산출물

각 안은 1280×800과 390×844 두 장을 한 세트로 만들며 다음을 반드시 포함한다.

- 실제 또는 명시된 sample Bonda 데이터, 한국어 production 수준 copy
- 첫 viewport 전체 composition과 근거 연결형 사건 연대기
- palette 4–6색의 역할, type 2역할, reference에서 도출한 spacing rhythm
- surface/divider/radius/depth 규칙과 icon 사용 범위
- chart의 axis, baseline, event, source 표현
- mobile에서 삭제·축약·sheet로 이동하는 정보 목록
- 1개의 signature interaction과 reduced-motion 대안
- `이 안이 AI template처럼 보일 수 있는 지점` 자체 비판 3개

세 안을 섞어 네 번째 타협안을 자동 생성하지 않는다. 선택된 한 안만 정교화하고,
선택되지 않은 안의 장식 요소를 임의로 합치지 않는다.

## 7. 목표 정보 구조

### Desktop

```text
┌ 제품명 ─ 검색 ─ 기준일 ─ 알림 ─ [채권 추가] ┐
├ 포트폴리오 요약: 상태 분포 | 미확인 변화 | 최근 갱신 ┤
│ 채권 목록  │ 선택 채권 / 등급 / 만기 / 매수 기준점     │
│ 280–320px │ ───────────────────────────────────── │
│ compact   │ 사건 연대기 + event marker                │
│ rows      │ category 상태표 | 재무 변화 도표           │
│           │ 최근 변화/근거 표                          │
│           │ 원문 근거 drawer | AI 참고 해석             │
└───────────┴────────────────────────────────────────┘
```

### Mobile

```text
┌ [목록] 선택 채권명        [필터] [추가] [더보기] ┐
├ 상태 / 매수 기준일 / 최근 갱신                     ┤
├ 사건 연대기 / 선택 사건                            ┤
├ category 상태표                                    ┤
├ 최근 변화 3건                                      ┤
├ 원문 근거                                           ┤
└ section nav 후보: 요약 | 변화 | 근거 | 더보기         ┘
```

모바일에서 전체 채권 목록은 상세 위에 길게 쌓지 않는다. `목록` button으로 여는
sheet 또는 별도 list view를 사용하고 선택 즉시 상세로 복귀한다. `계산`과 `AI 해석`을
동일한 하단 navigation 항목으로 승격해 검증된 근거와 같은 무게를 주지 않는다.
section nav의 위치와 고정 여부는 시안에서 320px safe area와 실제 task로 결정한다.

## 8. 그래프·도표 전환 계획

### 8.1 정식 API로 지금 만들 수 있는 시각화

| 사용자 질문 | 시각화 | 데이터 | 접근 가능한 보조 정보 |
|---|---|---|---|
| 어떤 채권을 먼저 봐야 하나 | 상태 분포 또는 우선순위 표 | `MyBondSummary[]` client 집계 | 상태·미확인·미산정 건수와 채권 목록 |
| 매수 뒤 무엇이 발생했나 | categorical event chronology | `SinceBought.timeline` | 날짜·종류·요약·근거 유무 표 |
| 현재 어느 category를 봐야 하나 | 5행 current state matrix | `currentRiskState` | category별 현재 상태 text |
| 재무가 얼마나 달라졌나 | baseline-current dumbbell 또는 bullet | `FinancialChange` | 기준값, 현재값, 변화율 표 |
| 그 시점에 알 수 있었나 | 공개시점 replay lane | replay timeline | version/event/재무 목록 |
| 근거는 무엇인가 | evidence table + expandable quote | risk event detail | 원문 text와 source link |

현재 REST/frontend 계약의 한계:

- `SinceBoughtTimelineItem`은 `date`, `type`, `summary`, `severity`, source ID를
  제공하지만 risk change의 `category`, `previousState`, `currentState`를 구조화해
  제공하지 않는다.
- `CurrentRiskState`는 현재 category 상태만 제공하며 과거 snapshot series가 아니다.
- 따라서 현재 계약으로 category state step line, category별 before/after, 모든
  risk change point의 근거 drawer를 만들 수 있다고 주장하지 않는다.
- 이 시각화가 필요하면 별도 API vertical slice에서 구조화된 risk change transition과
  evidence/source trace를 추가하고 backend/domain test를 먼저 통과시킨다. UI가
  `summary` 문자열을 parsing하거나 누락된 상태를 보간하는 방법은 금지한다.

### 8.2 mock에서만 가능한 시각화

- YTM, spread, market price와 그 변화는 현재 정식 API 계약이 없다.
- mock에서 sparkline을 보여줄 수는 있지만 `샘플`, 기간, 생성 규칙을 표시한다.
- 한 점의 현재값으로 가짜 추세선을 만들지 않는다.
- 추후 실제 시계열 API가 생기기 전에는 투자 판단용 시장 chart로 확장하지 않는다.

### 8.3 chart 구현 원칙

- event chronology, dumbbell, threshold bar는 작은 shared SVG primitive로 만든다.
- 복잡한 zoom, brush, 여러 series interaction이 필요해질 때만 chart dependency를
  검토한다. 현재 spec의 단순 frontend 구조를 지킨다.
- 축, 단위, 기간, 기준일, source를 chart 안 또는 바로 아래에 표시한다.
- tooltip만으로 값을 숨기지 않고 keyboard focus와 아래 표에서 동일 값을 제공한다.
- 색 외에 점 모양, 선 모양, label을 사용한다.
- mobile은 chart를 그대로 축소하지 않고 label 수, 범례 위치, event density를
  재구성한다.
- portfolio가 1–3건이면 분포 chart보다 우선순위 표가 더 정확할 수 있다. 데이터가
  적거나 모두 같은 상태이면 억지로 graph를 채우지 않는다.
- timeline item이 0건이면 empty guidance, 1건이면 annotated event row를 사용한다.
  두 점을 곡선으로 연결하거나 연속적인 위험 추세처럼 보이게 하지 않는다.
- `currentRiskState`, baseline 또는 current snapshot이 null이면 미산정 이유와 다음
  행동을 보여주며 0이나 정상 상태로 대체하지 않는다.

## 9. 모바일 icon 정책

아이콘은 작은 화면에서 모든 글자를 지우는 도구가 아니다.

아이콘 단독 허용:

- 뒤로, 닫기, 검색어 지우기, 새로고침
- 필터 열기, 정렬, 더보기
- 이미 문맥이 명확한 header의 채권 추가

텍스트 유지:

- 저장, 삭제, 진단 실행처럼 결과가 큰 action
- `원문`, `계산`, `AI 해석`처럼 제품 고유 개념
- 위험 상태와 투자 관련 의미

구현 규칙:

- Lucide 한 세트만 사용하고 emoji와 문자를 icon 대용으로 쓰지 않는다.
- icon 18–20px, 실제 touch target 최소 44×44px를 기본으로 한다.
- icon-only button은 `aria-label`과 필요 시 tooltip을 가진다.
- active, focus-visible, disabled, busy 상태를 공통 primitive에서 제공한다.
- 시안 검증 후 mobile bottom nav를 사용할 경우 icon과 1–2단어 label을 함께 둔다.

WCAG 2.2 AA의 최소 target 24px은 하한일 뿐이다. 금융 모바일 앱의 주요 utility
control은 더 넉넉한 44px target을 기본으로 한다.

## 10. motion system

목표는 `재미있는 animation`이 아니라 `변화의 원인을 놓치지 않는 전환`이다.

### Token

- Fast: 120ms — hover, pressed, focus surface
- Base: 180ms — tab, row selection, drawer
- Slow: 260ms — chart data update, panel enter/exit
- Enter easing: `cubic-bezier(0.2, 0, 0, 1)`
- Exit easing: `cubic-bezier(0.4, 0, 1, 1)`

### 적용

- 채권 선택: header text crossfade + chart point 180–260ms update
- tab 전환: opacity와 4px 이내의 짧은 이동, layout 높이는 안정적으로 유지
- filter: 삭제된 row를 과장 없이 fade, 결과 수를 live region으로 알림
- event 선택: marker와 evidence row를 같은 색/선으로 연결
- dialog/drawer: backdrop fade + 짧은 translate, focus 이동은 즉시
- loading: 정적인 progress label 또는 제한적인 spinner

### 금지

- 지속 pulse, bounce, floating card, hover scale, parallax
- `transition-all`
- 위험 수치가 튀거나 흔들리는 animation
- 처음 로드할 때 모든 카드가 순차 등장하는 stagger
- reduced-motion에서 transform 기반 전환 유지

## 11. 실행 순서: 작은 vertical slice

### Phase 0 — truth·fixture·기준선 잠금 (P0, 변경 전)

- `PRODUCT.md`, `IMPLEMENTATION_SPEC.md`, 실제 TypeScript response type을 화면 항목별로
  대조해 `현재 지원`, `client 집계 가능`, `API 확장 필요`, `sample only`로 분류한다.
- 현재 UI를 수정하기 전에 desktop 1280×800, tablet 768×1024, mobile 390×844와
  320×800의 baseline을 캡처한다.
- overview, metrics, timeline, raw fact, AI, dialog open, loading, empty, error 상태에
  사용할 하나의 고정 fixture와 기준일을 정한다. 실제 데이터와 sample 데이터는
  view model 단계에서 구분한다.
- repository에서 재현 가능한 capture 명령과 결과 위치를 정한다. 기존 도구로 불가능할
  때만 최소한의 browser test 도구를 dev dependency로 제안하고 승인 근거를 남긴다.
- 핵심 사용자는 `최근 1년 안에 회사채 또는 채권형 상품 정보를 확인한 한국어 사용자`로
  한정하고, 전문 투자자용 terminal을 목표로 하지 않는다고 brief에 명시한다.
- project-root `UX-CONTRACT.md`에는 목록→상세 navigation, filter 복원, loading/empty/
  error, dialog/sheet, notification, focus·scroll 복귀 같은 관찰 가능한 행동만 기록한다.
  business rule은 복제하지 않고 `PRODUCT.md`, `IMPLEMENTATION_SPEC.md`를 참조한다.

완료 조건: 코드 변경 전 baseline, fixture, 데이터 출처표, UX contract와 재현 명령이
존재한다.

### Gate 1 — visual target 선택 (구현 전 필수)

- Phase 0의 brief와 fixture를 사용해 component reference board를 만들고 출처,
  가져올 원리와 복제하지 않을 표현을 기록한다.
- 같은 데이터로 desktop/mobile 시안 3세트를 같은 fidelity로 만든다.
- 제품 owner와 가능한 목표 사용자가 5초 첫인상과 별도 핵심 task를 비교한다.
- 선택 이유, 탈락 이유, 아직 검증되지 않은 가정을 기록해 한 방향만 선택한다.
- 선택안을 project-root `DESIGN.md`의 color, typography, grid, component, chart,
  motion, responsive, do/don't로 기록하고 형식 lint를 통과시킨다.
- `DESIGN.md`에서 runtime CSS/token으로 이어지는 owner와 mapping을 명시한다.

완료 조건: production 구현에 사용할 단 하나의 방향, target screenshot, 선택 근거,
미검증 위험이 있다. 이 gate 전에는 전체 UI restyling을 시작하지 않는다.

### Slice 1 — `/monitoring` canonical owner와 신뢰 계약 통합 (P0)

- baseline을 보존한 뒤 runtime route의 `frontend/mock` 직접 import를 실제
  `frontend/src` owner로 옮긴다. landing과 보존 route는 이 slice에 섞지 않는다.
- `DemoMonitoring.tsx`와 mock main 중 하나만 `/monitoring` canonical owner로 남긴다.
- 문자열 기반 `mock-tailwind.css` override를 제거하고 승인된 token과 component
  source에 직접 반영한다.
- 투자 추천·부도 단정 mock copy를 제거하고 실제 데이터와 sample 표기를 분리한다.
- 빈 hash link, form validation owner, native date/select owner, textarea resize 등
  strict audit의 11개 error를 해당 owner에서 해결한다.
- button, icon button, status label, dialog, tab, data row만 얇게 공통화한다.

완료 조건: `/monitoring`의 token·component·behavior owner가 한 곳이며 mock override와
해당 route 소유 strict audit error가 없다. 이전 기능과 모든 fixture 상태가 유지된다.

이 slice에서 `@playwright/test`를 dev dependency로 도입하고 `test:ui`와
`capture:ui`를 repository-owned command로 만든다. 고정 fixture, timezone, animation
비활성 capture mode를 사용해 desktop/mobile screenshot과 핵심 task를 재현한다.

### Slice 2 — professional desktop shell (P1)

- 큰 빈 공간과 3대 원칙 상시 bar를 제거하거나 도움말로 이동한다.
- 채권 목록 row를 이름, 현재 risk state, 최근 변화, 기준일 중심의 64–84px compact
  row로 바꾼다.
- 선택 채권 header와 주요 상태를 한 data strip으로 통합한다.
- primary action은 하나만 남기고 나머지는 neutral/icon utility로 낮춘다.

완료 조건: 첫 viewport에서 목록, 선택 상태, 최근 변화, 근거 진입점이 함께 보인다.

### Slice 3 — data-first overview (P1)

- 근거 연결형 사건 연대기를 overview의 주요 요소로 만들되, event 0–1건에서는 empty
  guidance 또는 annotated row로 전환한다.
- 5개 risk category matrix와 baseline-current 재무 도표를 추가한다.
- 기존 3열 원문·계산·AI 카드는 `최근 변화/근거` 표와 별도 AI 참고 영역으로
  교체한다.
- 실제 API가 없는 시장 데이터는 정식 chart에서 제외한다.
- category transition chart는 구조화된 API가 생기기 전에는 만들지 않는다.

완료 조건: 별도 task test에서 사용자가 `무엇이 언제 발생했고 근거가 어디 있는지`를
찾는다. 5초 test는 우선 정보와 product category의 첫인상만 평가한다.

### Slice 4 — mobile task flow (P1)

- 목록을 sheet 또는 list view로 분리하고 선택 후 상세에 집중한다.
- header utility를 icon-only 44px target으로 바꾼다.
- 긴 tabs는 검증된 근거가 우선되도록 3개 이하의 primary section과 `더보기`로
  재구성한다. AI 해석에 deterministic 정보와 같은 navigation 무게를 주지 않는다.
- chart label과 event density를 320–390px 전용으로 재구성한다.
- nested vertical scroll을 제거한다.
- sheet, sticky control, section nav는 safe area, virtual keyboard, focus 가림과 scroll
  restoration을 함께 검증한다.

완료 조건: 320px에서 문서와 핵심 panel에 의도치 않은 가로 scroll이 없고,
목록 선택 후 한 번의 전환으로 상세 변화가 보인다.

### Slice 5 — resilience·motion·accessibility hardening (P1)

- 접근성, loading/empty/error와 control state는 Slice 1부터 각 slice의 완료 조건이다.
  이 단계까지 미루지 않는다.
- motion token을 만들고 `transition-all`, 지속 pulse를 제거한다.
- chart point, filter, tab, drawer의 상태 연결 motion을 구현한다.
- keyboard, focus order, dialog focus trap/복귀, tab arrow key, icon accessible name을
  검증한다.
- chart마다 text summary 또는 data table을 제공한다.
- `prefers-reduced-motion`에서는 의미 손실 없이 animation을 제거한다.

완료 조건: WCAG 2.2 AA 기준의 target, focus, name, reflow와 reduced motion을 통과한다.

### Slice 6 — landing과 보존 route 확장 (P2)

- dashboard와 무관한 generic centered hero 문법을 줄이고 실제 제품 chart preview를
  hero의 주 시각 요소로 사용하되 sample이면 바로 표시한다.
- `/holdings/:holdingId/since-bought`, `/risk-events/:riskEventId`, `/admin/replay`에 같은 token과
  chart primitive를 route 단위로 확장한다.
- feature card 3개를 반복하지 않고 실제 `변화 → 계산 → 근거` 흐름을 보여준다.
- 각 route를 옮기기 전에 그 route의 native control, validation, false affordance 오류를
  해결한다. 마지막 route 완료 후 project strict audit을 다시 실행한다.

완료 조건: route마다 다른 스타일이 아니라 Gate 1에서 선택된 디자인 문법을 사용하고,
project strict audit이 0 error다.

## 12. 검증과 완료 gate

각 slice마다 다음을 모두 수행한다.

1. `frontend/`에서 `npm run check:ui`
2. `frontend/`에서 `npm run build`
3. `frontend/`에서 `npm run test:ui`
4. 동일 데이터와 viewport의 before/after screenshot 비교
5. 1280×800, 768×1024, 390×844, 320×800 확인
6. 200% zoom과 keyboard-only main task 확인
7. hover, focus, active, disabled, busy, loading, empty, error, no-results 확인
8. reduced motion 확인
9. `transition-all`, 12px 미만 본문, decorative gradient, 지속 pulse, mock source runtime
   import, 근거 없는 시장 추세 chart 정적 검사
10. 선택된 `DESIGN.md`와 target mockup의 hierarchy, density, type, chart, mobile
   composition을 screenshot diff와 육안 review로 비교
11. `신뢰감`, `전문성`, `시각적 매력`, `정보 정돈감`이 acceptance 기준을 유지하는지
    확인하고, 핵심 task 성공 여부와 별도로 기록

완료 보고에는 `변경 파일`, `검증 명령 결과`, `viewport별 capture`, `접근성 확인`,
`방향별 rating과 이유`, `task 결과`, `남은 mock/API gap`을 포함한다. build 성공, 자기평가,
한 장의 desktop screenshot만으로는 완료 처리하지 않는다.

## 13. 최종 승인 질문

- 이 화면은 회사명과 보라색을 바꿔도 아무 SaaS에나 맞는가? 그렇다면 실패다.
- 회사채 경험이 적은 개인투자자가 기관용 jargon을 배우지 않고도 첫 task를 끝내는가?
- 목표 사용자가 별도 설명 없이 `정교하다`, `신뢰가 간다`, `계속 보고 싶다`고
  평가하는가?
- 예뻐진 이유를 gradient·shadow 개수가 아니라 hierarchy, type, chart composition과
  Bonda 고유 signature로 설명할 수 있는가?
- 위험 결론보다 변화 시점, category, threshold와 원문 근거가 먼저 보이는가?
- chart의 모든 값이 정식 API 또는 명시된 sample source로 추적되는가?
- 데이터가 0–1건이거나 risk state가 미산정일 때 chart를 억지로 만들지 않는가?
- AI 해석이 deterministic state를 시각적으로 덮어쓰지 않는가?
- mobile에서 목록과 상세이 서로 다른 task로 분리되는가?
- icon-only control의 의미와 target이 충분한가?
- animation이 상태 관계를 설명하며 reduced motion에서도 같은 일을 끝낼 수 있는가?
- card와 색을 제거해도 정보 관계가 grid, type, axis, rule로 남는가?
- before/after evidence가 실제 개선을 증명하는가?

하나라도 `아니오`면 해당 slice는 완료가 아니다.
