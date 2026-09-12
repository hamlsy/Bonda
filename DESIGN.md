---
version: alpha
name: "Bonda"
description: "근거가 확인된 신용 변화를 먼저 보여주는 한국어 개인 채권 모니터링 UI"
colors:
  ink: "#0B1714"
  muted: "#66736F"
  paper: "#FFFFFF"
  surface: "#F6F9F8"
  line: "#DCE5E2"
  primary: "#08785C"
  primary-dark: "#04513F"
  signal: "#49B99B"
  control: "#AEBDB8"
  error: "#C63F35"
  watch: "#C66C18"
  caution: "#DF453C"
typography:
  display:
    fontFamily: "Paperlogy, 'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Malgun Gothic', sans-serif"
  sans:
    fontFamily: "'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
  data:
    fontFamily: "'Pretendard Variable', Pretendard, Inter, 'Noto Sans KR', sans-serif"
rounded:
  sm: "0.375rem"
  DEFAULT: "0.75rem"
  lg: "1rem"
spacing:
  inline: "0.5rem"
  component: "1.25rem"
  section: "3rem"
components:
  button:
    backgroundColor: "#08785C"
    textColor: "#FFFFFF"
    rounded: "0.75rem"
    height: "2.75rem"
  card:
    backgroundColor: "#FFFFFF"
    textColor: "#0B1714"
    rounded: "1rem"
  status:
    backgroundColor: "#F6F9F8"
    textColor: "#0B1714"
    rounded: "0.375rem"
---

# Bonda Design System

## Overview

### Product design philosophy

Bonda는 AI가 결론을 대신 내리는 dashboard가 아니다. 사용자가 보유한 채권에서 **무엇이, 언제, 어떤 근거로 달라졌는지** 빠르게 확인하는 한국어 신용 모니터링 도구다. 원문 사실, deterministic 계산 결과, 제한적인 AI 해석을 같은 권위로 보이게 하지 않는다.

### Design direction

최종 방향은 **근거 우선형 모니터링 에디토리얼**이다. 굵고 짧은 한국어 제목, 정렬된 숫자, 가는 시간선과 divider로 변화의 흐름을 편집한다. 화면은 반복 방문하는 product UI이며 generic SaaS hero나 카드형 dashboard가 아니다.

### Information hierarchy

모든 화면은 다음 순서를 기본으로 한다.

1. 채권·발행사 identity
2. 현재 종합 상태와 unread/최근 변화
3. 매수 이후 날짜순 변화
4. 비교 수치와 검증 원문
5. Bonda의 보수적 해석

상태와 변화가 숫자보다 우선하고, 숫자는 라벨·단위·기준일·비교 대상과 함께 표시한다. 접수번호, 정책 버전과 AI 설명은 tertiary 정보다. 홈과 상세 첫 viewport에는 제품 소개보다 사용자가 확인할 상태와 행동을 둔다.

### Contract status

이 문서는 승인된 목표 계약이다. 기존 frontend는 화면별 vertical slice로 이 계약에 맞춘다. 첫 reference implementation은 PortfolioPage의 상태 요약부터 My Bonds 목록까지이며, 문서 token은 `frontend/src/styles.css`의 `:root`가 소유한다. 아직 이전하지 않은 화면과 하단 등록 영역은 legacy로 간주하고 후속 slice에서 같은 규칙으로 정리한다.

## Colors

`paper`를 page background, `surface`를 독립적인 보조 영역, `ink`와 `muted`를 정보 계층에 사용한다. `line`은 section과 list의 기본 구분선이다.

`primary`는 wordmark, 안전한 primary action, 선택/focus와 NORMAL 상태에만 사용한다. `signal`은 실제 monitoring line과 검증된 event node에만 사용한다. 넓은 배경, 모든 링크·아이콘·section label을 green으로 칠하지 않는다.

`watch`와 `caution`은 브랜드 색의 변형이 아니라 독립된 semantic state다. `error`는 실패와 수정이 필요한 입력에만 사용한다. 색만으로 상태를 전달하지 않고 상태명, 방향 또는 아이콘을 함께 제공한다. 장식용 gradient는 사용하지 않는다.

## Typography

Display는 wordmark와 한 화면의 핵심 제목 한 곳에만 사용한다. Page title은 24–36px, section heading은 20–24px, body는 16–17px, metadata는 12–14px를 기준으로 한다. 제목 weight는 700–800, body는 400–600으로 제한하며 모든 heading을 900으로 만들지 않는다.

한국어 body line-height는 1.55–1.7, heading은 1.2–1.35를 사용한다. 숫자는 `data` role과 tabular numerals를 사용하고 단위는 한 단계 작게 둔다. display font는 실제 asset을 제공할 때만 사용하며 fallback만으로 브랜드 typography를 주장하지 않는다.

사용자-facing copy는 한국어를 기본으로 한다. 반복 영문 eyebrow, 내부 용어인 `Risk State`·`Event`, 영문 slogan은 제거한다. label, heading, helper가 같은 내용을 반복하지 않게 한다.

## Layout

본문 최대 폭은 1360px, 모바일 바깥 여백은 최소 16px, 데스크톱은 24–32px다. 기본 구조와 DOM 읽기 순서는 한 열이다. 데스크톱 2열은 채권 요약과 관련 알림처럼 직접 연관된 정보에만 8:4 또는 2:1 비율로 사용한다.

Section 간격은 40–48px, component 내부는 약 20px, inline 관계는 8px을 기준으로 한다. 모든 section에 같은 padding과 같은 surface를 주지 않는다. Whitespace, divider와 type scale이 먼저 구조를 만들고 card는 예외적으로 사용한다.

홈은 unread 변화와 현재 상태를 첫 viewport에 둔다. Since I Bought는 compact identity, 종합 상태, 최근 변화, timeline 순서다. Evidence detail의 제목–출처–검증 구간 구조는 유지한다.

## Elevation & Depth

Surface hierarchy는 `paper → surface → 1px line → semantic tint` 순서다. 정적 card와 section에는 shadow를 사용하지 않는다. Shadow는 modal, sheet, popover처럼 실제로 겹치는 layer에만 약하게 사용한다. Blur와 glassmorphism은 사용하지 않는다.

## Shapes

Radius는 6px, 12px, 16px 세 종류만 사용한다. 12px는 control, 16px는 정말 독립적인 큰 surface, 6px는 작은 상태 표식에 사용한다. Pill은 짧은 status나 unread count처럼 의미가 있을 때만 허용한다. Section, list row, timeline event와 단순 수치에는 radius를 적용하지 않는다.

## Components

### Navigation

Desktop은 얇은 top navigation, mobile은 3–5개의 빈번한 사용자 목적지만 포함한 sticky bottom navigation을 사용한다. 현재 위치는 색상뿐 아니라 indicator와 `aria-current`로 표시한다. Historical Replay 같은 낮은 빈도의 고급 기능은 primary mobile slot보다 낮은 계층에 둔다. 아이콘은 단일 stroke 계열을 쓰고 낯선 행동에는 text label을 유지한다.

### Button

Emphasis는 solid, outline, text/ghost 세 단계만 사용한다. 한 영역에는 하나의 primary action만 둔다. 높이는 desktop 44px, mobile 핵심 action 48px을 기준으로 하며 busy 상태에서도 크기를 유지한다. Press와 hover에서 content를 이동시키지 않는다.

### Section, list and card

Section은 heading, whitespace와 divider로 구분한다. My Bonds, Alert, Timeline은 card 묶음이 아니라 divider 기반 list다. Card는 하나의 채권 요약, 독립적인 상태 결정, 원문과 분리할 AI 해석, error/empty처럼 경계가 필요한 경우에만 사용한다. Card 안에 card를 넣지 않는다.

List row는 identity, 현재 상태/최근 변화, 날짜, 다음 행동 순서로 읽힌다. 전체 row가 이동하면 실제 link를 사용하고 내부 action과 충돌시키지 않는다.

### Status and badge

`NORMAL / WATCH / CAUTION`의 의미와 표현을 전 화면에서 고정한다. 상세 화면은 종합 상태를 먼저, category 상태를 다음에 보여준다. Badge는 severity, unread, source처럼 짧은 분류에만 사용하고 설명문과 metadata를 pill로 만들지 않는다.

### Timeline and data visualization

Timeline은 매수일을 시작점으로 날짜순을 유지한다. 선은 흐름, node는 실제 매수·검증 Event·RiskChange를 의미한다. 중요한 상태 변화만 node의 크기나 semantic tone을 높인다. Desktop은 충분한 폭에서 가로, mobile은 세로다.

Chart는 실제 값, 기간, 단위, 기준점이 있을 때만 사용한다. 축 없는 장식 chart, 원형 KPI, 3D와 무의미한 area fill은 금지한다. 브랜드 Change Line은 제품 데이터 화면에서 실제 timeline과 대응할 때만 사용하며 정적인 hero 장식으로 반복하지 않는다.

### Evidence and interpretation

Evidence는 날짜, 공시 출처와 검증 구간을 명시하고 펼침/접힘으로 원문을 확인하게 한다. AI 해석은 Evidence보다 낮은 contrast의 별도 surface에 두며 Risk State 결정에 사용되지 않는다는 사실을 짧게 밝힌다.

### Modal, sheet and search

Destructive action은 app-owned accessible dialog를 사용한다. 긴 mobile 작업만 sheet/full-screen variant를 허용한다. Search는 실제 채권 수가 탐색을 요구할 때 도입하며 clear button, 300ms debounce, IME 안전성과 stale request 취소를 갖춘다. 기능 없는 mock search는 만들지 않는다.

### Empty, loading and error

상태 영역은 최종 content와 비슷한 공간을 예약한다. Empty는 다음 가능한 행동을, error는 실패 대상과 retry를 명확히 제공한다. 오류 중 존재하지 않는 destination으로 향하는 CTA를 남기지 않는다. 기존 content가 있으면 background refresh 중 제거하지 않는다.

### Interaction

Hover, focus-visible, active, disabled, busy를 함께 정의한다. Hover는 border, background 또는 text tone 한 단계만 바꾸고 위치를 움직이지 않는다. Transition은 상태 전달에만 160–220ms를 사용하며 `prefers-reduced-motion`에서는 제거한다. Evidence disclosure와 상태 전환 외의 장식 animation은 만들지 않는다.

### Mobile

Mobile 정보 순서는 `identity → 종합 상태 → unread/최근 변화 → 변화 개수 → timeline → evidence → 재무 비교 → AI 해석`이다. 모든 section은 한 열로 쌓고 secondary metadata와 긴 해석은 접거나 뒤로 보낸다.

Touch target은 최소 44×44px, 핵심 action은 48px을 목표로 한다. Bottom navigation과 sticky header가 content와 focus를 가리지 않게 safe-area와 하단 여백을 확보한다. 핵심 정보와 timeline에는 horizontal scroll을 사용하지 않는다. 큰 원문 표만 명시적인 내부 scroll을 허용한다.

### Signature UI

1. **Change Spine:** 매수일과 검증된 변화를 잇는 가는 선과 semantic node. 실제 데이터가 없으면 그리지 않는다.
2. **Since I Bought Anchor:** 모든 변화 화면은 사용자의 매수일을 명시적인 시간 기준점으로 삼는다.
3. **Evidence Ladder:** `상태 → 변화 → 계산/원문 근거 → 제한적 AI 해석` 순서를 화면과 navigation에서 반복한다.

## Do's and Don'ts

- **Do:** 사용자가 다시 방문할 때 현재 상태와 새 변화를 먼저 보여준다.
- **Do:** 숫자와 상태에 기준일, 단위와 출처를 붙인다.
- **Do:** 사실, deterministic 계산과 AI 해석을 시각적으로 분리한다.
- **Do:** 큰 변경을 Home 상단부터 검증 가능한 vertical slice로 적용한다.
- **Don't:** purple/blue 또는 decorative gradient, gradient text, glassmorphism을 사용한다.
- **Don't:** excessive shadow, nested card, card soup, 동일한 rounded surface 반복을 사용한다.
- **Don't:** generic SaaS hero, KPI card grid, modern fintech dashboard 문법을 사용한다.
- **Don't:** badge, pill, 영문 eyebrow, helper copy와 의미 없는 icon을 남발한다.
- **Don't:** 장식 illustration, 데이터와 무관한 chart, 기능과 무관한 animation을 추가한다.
- **Don't:** shadcn 또는 다른 library의 default appearance를 그대로 사용한다.
- **Don't:** 검증되지 않은 AI output, 수익 보장, 부도 예측 또는 투자 추천을 확정 정보처럼 표현한다.
