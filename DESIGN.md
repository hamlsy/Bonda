---
version: alpha
name: "Bonda Evidence Rail"
description: "검증된 사건과 계산 근거를 먼저 보여주는 개인투자자용 회사채 신용 리서치 워크스테이션"
colors:
  ink: "#17212B"
  muted: "#5D6975"
  canvas: "#F5F7F8"
  surface: "#FFFFFF"
  rule: "#C9D0D6"
  control: "#24559A"
  control-soft: "#E9F0F8"
  normal: "#34735A"
  watch: "#B65A1B"
  caution: "#A43A32"
  unavailable: "#6F7780"
typography:
  sans:
    fontFamily: "Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
  mono:
    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace"
rounded:
  DEFAULT: "0.375rem"
  sm: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
spacing:
  section-gap: "1.5rem"
  page-max: "90rem"
components:
  button: { }
  icon-button: { }
  dialog: { }
  tabs: { }
  data-list: { }
  chart: { }
  status-label: { }
---

# Bonda Evidence Rail Design System

## Overview

### Creative North Star

증권사 리서치 노트의 정렬된 표와 사건 연표를, 개인투자자가 전문 용어를 외우지
않아도 읽을 수 있는 조용한 디지털 작업면으로 옮긴다. 선택된 기준 화면은
[`docs/design/evidence-rail-reference.png`](docs/design/evidence-rail-reference.png)다.

### Product context and register

- **Audience and primary job:** 한국 개인 회사채 투자자가 보유 채권의 매수 후 변화를 발견하고 날짜, 계산, DART 원문 근거를 확인한다.
- **Target market(s) and evidence:** 대한민국. `docs/PRODUCT.md`의 개인투자자 범위와 OpenDART·원화 재무정보 계약을 따른다.
- **Locale(s) and language policy:** UI와 제품 카피는 한국어 우선이며 영문은 ISIN, 규칙 버전 등 식별자에만 쓴다. 최종 문구는 제품 책임자가 검토한다.
- **Usage scene:** 데스크톱에서는 여러 채권을 비교하고, 모바일에서는 선택한 한 채권의 최근 변화와 근거를 빠르게 확인한다.
- **Register:** 제품 화면은 전문적인 리서치 도구, 랜딩은 절제된 브랜드 소개다.
- **Memorable signature:** 사건을 선택하면 같은 사건의 근거 행이 연결되어 강조되는 `근거 연결형 사건 연대기`다.
- **Restraint:** 입력, 대화상자, 검색, 오류 복구는 익숙한 패턴을 유지하고 장식적 표현을 쓰지 않는다.
- **Anti-references:** 보라색 gradient SaaS hero, 모든 내용을 둥근 카드로 감싼 AI dashboard, 실제 계약에 없는 추세 그래프, 기관 terminal을 흉내 낸 과밀 화면.
- **Token ownership/runtime mapping:** 이 문서는 승인된 규칙을 기록한다. 실제 token owner는 `frontend/src/styles.css`이며 `npm run check:ui`와 strict premium audit으로 drift를 막는다.

## Colors

Canvas `#F5F7F8` 위에 실제 작업면 Surface `#FFFFFF`를 놓고 Ink `#17212B`로 정보
위계를 만든다. Control `#24559A`는 선택, focus, 주 동작에만 쓴다. Watch
`#B65A1B`와 Caution `#A43A32`는 검증된 위험 상태와 임계치 초과에만 쓴다.
상태는 색만으로 전달하지 않고 텍스트, 기호, 선 모양을 함께 사용한다. chart의 비교
기준은 Rule `#C9D0D6`, 현재값은 Ink, 임계치 초과는 위험색으로 구분한다. gradient는
쓰지 않으며 forced-colors에서는 플랫폼 색을 따른다.

## Typography

Pretendard를 우선하고 한국어를 안정적으로 지원하는 시스템 font로 fallback한다.
페이지 제목은 24–32px/700–760, section 제목은 16–20px/700, 본문과 control은
14px 이상, 보조 정보는 12px 이상을 사용한다. 한국어 제목에 과한 자간 축소를 하지
않고 본문 line-height는 최소 1.5다. 숫자와 날짜는 tabular numeral을 사용한다.
monospace는 ISIN, source id, rule version에만 허용한다. 영문 대문자 eyebrow를 반복하지
않고, 이탤릭은 제품 UI에서 사용하지 않는다.

## Layout

데스크톱은 최대 1440px 작업면에서 `240px 목록 + 유동 상세` 2열을 사용한다. 첫
1280×800 viewport에 목록, 선택 채권 identity, 사건 연대기, 상태 matrix, 근거 진입점이
함께 보여야 한다. 기본 간격은 6/10/14/20/24px의 작은 rhythm을 쓰고 section 사이만
24px을 허용한다. 820px 이하에서는 목록을 상세 위에 쌓지 않고 전환 가능한 compact
selector로 바꾼다. 620px 이하에서는 44px icon utility와 하단 navigation을 사용하고
safe-area를 보존한다. 중첩 세로 scroll은 금지하며 loading·empty 상태도 최종 geometry를
유지한다.

## Elevation & Depth

위계는 주로 배경 tone, 1px rule, typography와 sticky 위치로 만든다. 목록 선택 행은
Control색 3px rail과 Surface로 표시한다. shadow는 dialog와 mobile sheet처럼 실제로
떠 있는 layer에만 낮은 강도로 허용한다. chart, 표, section마다 shadow를 만들지 않고
blur와 glass 효과를 쓰지 않는다.

## Shapes

작업면과 표는 직선 rule을 기본으로 한다. control은 6px, dialog는 8px까지 사용한다.
상태 label은 pill 대신 4px radius의 작은 사각 표식과 텍스트를 사용한다. 원형은 사건
marker, radio 성격의 상태, icon button에만 의미 있게 쓴다. icon은 1.75–2px stroke를
유지한다.

## Components

### Foundational visual states

기본과 hover의 위치는 변하지 않는다. `:focus-visible`은 2px Control outline과 2px
offset을 사용한다. selected는 색과 rail/underline을 같이 표시한다. disabled는 opacity만
낮추지 않고 cursor와 label로 이유를 제공한다. busy는 control 폭을 유지하고 text 옆에
작은 spinner를 둔다. success, warning, error는 동일 위치의 inline status로 제공한다.
loading skeleton은 dense data row에만 쓰며 pulse하지 않는다.

### Buttons and actions

한 화면의 primary filled action은 하나만 둔다. secondary는 흰 배경과 rule border,
utility는 icon button이다. 기본 target은 44px이며 desktop dense table 내부만 36px를
허용한다. destructive action은 Caution 색으로 분리하고 확인 dialog를 거친다. icon-only
button은 항상 accessible name과 tooltip 또는 인접 문맥을 가진다.

### Navigation and data display

상단 navigation은 제품 영역을 구분하고 현재 route를 underline으로 표시한다. 상세
section은 `요약`, `변화`, `근거` 3개를 우선하고 부가 기능은 `더보기`로 모은다. 채권
목록 행은 이름, 등급, 상태, 최신 변화 날짜를 같은 column에 맞춘다. 연대기는 실제
사건만 discrete marker로 그리며 사건 간격을 추세로 오해하게 만드는 spline을 쓰지
않는다. 모든 chart는 같은 값을 담은 요약 또는 표를 함께 제공한다.

### Forms and overlays

모든 form은 app-owned validation과 `noValidate`를 사용한다. 검색은 즉시 filter하고
clear control로 입력 focus를 복귀한다. 날짜와 select는 한국어 플랫폼 표기를 수용한
native control을 canonical owner로 한다. textarea는 `resize: none`이다. dialog는
focus trap, Escape, backdrop dismiss, opener focus 복귀를 지원한다. 모바일 목록은
bottom sheet가 아니라 현재 구현 범위에서는 native select/compact list 전환을 사용해
복잡도를 제한한다.

### Iconography

Lucide React의 outline icon을 18–20px, stroke 1.75px로 사용한다. 모바일 utility는
검색, 추가, 새로고침, 더보기처럼 관습이 강한 동작만 icon-only로 바꾼다. 채권 상태,
navigation, 위험 결론은 텍스트 label을 유지한다. emoji와 장식 icon은 쓰지 않는다.

### Motion

motion은 `120ms feedback`, `180ms content`, `260ms disclosure` 세 duration과
`cubic-bezier(0.2, 0, 0, 1)` easing을 사용한다. hover/focus, 선택 행 변경, 사건과 근거
연결, section disclosure에만 적용한다. 지속 pulse, bounce, scroll hijacking,
`transition: all`은 금지한다. `prefers-reduced-motion: reduce`에서는 즉시 전환하되
정보와 focus 이동은 동일하게 유지한다.

### Content and data visualization

카피는 `확인되었습니다`, `계산 기준`, `원문 보기`처럼 사실과 행동을 명확히 쓴다.
부도 예측, 상환 보장, 매수·매도·보유 추천을 하지 않는다. 숫자는 단위와 기준일을
가까이 표시하며 변화율은 부호와 비교기간을 함께 쓴다. 시각화 값은 API 계약 또는
명시된 `[데모]` fixture에서만 가져온다. AI 설명은 `참고 해석`으로 접어 두고 공식
Risk State나 사건 순서를 바꾸지 못한다.

## Do's and Don'ts

- **Do:** 사건 marker, 계산 행, DART 원문을 동일한 source id로 연결한다.
- **Do:** card가 없어도 정렬, rule, type scale만으로 비교 관계가 남게 만든다.
- **Do:** 모바일에서 목록 선택과 상세 검토를 서로 다른 작업으로 취급한다.
- **Don't:** 근거 없는 시장가격, YTM, spread 추세를 정식 chart처럼 제시한다.
- **Don't:** 위험색을 brand accent로 재사용하거나 AI 결과를 primary panel로 올린다.
- **Don't:** gradient, glass, 중첩 rounded card, 상시 pulse로 전문성을 연출한다.
