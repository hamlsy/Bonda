---
version: alpha
name: "Bonda"
description: "채권 증서의 신뢰감과 지속 모니터링 신호를 결합한 한국어 금융 제품 UI"
colors:
  ink: "#14231F"
  muted: "#62716C"
  paper: "#FFFFFF"
  surface: "#F3F7F5"
  line: "#CCD9D4"
  primary: "#0D654E"
  primary-dark: "#084B3A"
  signal: "#D6EA73"
  control: "#82958E"
  error: "#A13D2D"
typography:
  display:
    fontFamily: "Georgia, 'Times New Roman', serif"
  sans:
    fontFamily: "ui-sans-serif, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif"
rounded:
  sm: "0.375rem"
  DEFAULT: "0.75rem"
  lg: "1.25rem"
spacing:
  compact: "0.5rem"
  content: "1.25rem"
  section: "3rem"
components:
  status-card: {}
  form: {}
  button: {}
---

# Bonda Design System

## Overview

### Creative North Star

인쇄된 채권 증서의 절제된 타이포그래피 위에 얇은 실시간 신호선이 지나가는 장면을 기준으로 한다.

### Product context and register

- **Audience and primary job:** 보유하거나 관심 있는 회사채의 발행기업 변화를 반복적으로 확인하는 한국 개인투자자.
- **Target market and evidence:** `PRODUCT.md`에 정의된 한국어 서비스 초기 기반.
- **Locale and language policy:** 초기 UI는 한국어(`ko-KR`)이며 기술 식별자만 영문을 허용한다.
- **Usage scene:** 데스크톱과 모바일에서 짧고 반복적으로 확인하는 제품 화면.
- **Register:** 기능 명확성을 우선하는 product UI.
- **Memorable signature:** 주요 구획을 가로지르는 얇은 monitoring signal line.
- **Restraint:** 금융 정보와 위험 상태 영역은 장식보다 가독성과 근거 구분을 우선한다.
- **Anti-references:** 투자 수익을 과장하는 네온 trading UI, 장식적인 카드가 반복되는 범용 SaaS landing page.
- **Token ownership/runtime mapping:** 이 문서가 시각 토큰의 기준이며 `frontend/src/styles.css`의 `:root` 변수가 이를 직접 구현한다.

## Colors

`ink`, `paper`, `surface`를 기본 정보 계층에 사용한다. `primary`는 브랜드와 현재 상태에, `signal`은 monitoring 신호선에 제한한다. 위험 색상은 실제 risk 상태가 정의되는 후속 단계에서 별도로 결정한다.

## Typography

영문 서비스명과 짧은 표식에는 `display`, 한국어 본문과 제어에는 `sans`를 사용한다. 데이터 숫자는 tabular numerals를 사용하며 본문은 최소 16px를 유지한다.

## Layout

본문 최대 폭은 1120px이며 넓은 화면에서는 설명과 현재 기반 상태를 두 열로 배치한다. 좁은 화면에서는 한 열로 전환하고 20px 이상의 바깥 여백을 유지한다.

## Elevation & Depth

정보 계층은 배경색과 1px 선으로 구분한다. 정적 카드에는 그림자를 사용하지 않는다.

## Shapes

큰 surface는 `lg`, 작은 상태 표식은 `sm` radius를 사용한다. pill 형태는 실제 status처럼 의미가 있는 경우에만 쓴다.

## Components

### Foundational visual states

초기 loading, empty, error와 등록 success 상태를 안정된 영역에서 표시한다. 상호작용은 hover, focus-visible, active, disabled, busy를 함께 정의하고 `prefers-reduced-motion`을 존중한다.

### Buttons and actions

등록은 `primary` solid button, 재시도는 outline button을 사용한다. busy 상태에서도 버튼 크기를 유지한다.

### Navigation and data display

현재 단일 화면에서 작은 bounded bond 목록을 모두 표시한다. 채권 행은 카드 대신 divider 기반 목록으로 구성하고 신용등급·금리·만기를 먼저 읽을 수 있게 한다.

### Forms and overlays

Holding과 Watchlist 등록 form은 같은 field, validation, busy, feedback 패턴을 공유한다. 현재 최소 단계에서는 native select와 native date input의 OS 소유 popup을 허용하며 별도 authored component를 만들지 않는다. 브라우저 기본 dialog는 사용하지 않는다.

### Iconography

현재 아이콘 dependency는 두지 않는다. 아이콘을 도입할 때는 단일 stroke 계열을 선택하고 낯선 동작에는 텍스트 label을 유지한다.

### Motion

상태 변화 전달에만 160–220ms 범위의 짧은 motion을 사용하며 장식적 반복 animation은 피한다.

### Content and data visualization

한국어 문장은 사실과 해석을 구분해 간결하게 쓴다. 숫자와 위험 상태는 설명 가능한 deterministic 결과만 표시한다.

## Do's and Don'ts

- **Do:** 원문 사실, 계산 결과, AI 해석을 시각적으로 명확히 구분한다.
- **Do:** `DESIGN.md` 토큰 변경 시 `frontend/src/styles.css`를 함께 갱신한다.
- **Don't:** 수익 보장이나 긴급 매수를 암시하는 시각 언어를 사용하지 않는다.
- **Don't:** 기능이 없는 control이나 장식 목적의 dashboard card를 추가하지 않는다.
