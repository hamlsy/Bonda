---
version: alpha
name: "Bonda"
description: "회사채의 원문 사실, 재현 가능한 계산, 제한적 AI 해석을 한 흐름으로 읽는 한국어 신용 모니터링 UI"
colors:
  ink: "#0B1C30"
  muted: "#5F6B7A"
  canvas: "#F8F9FF"
  paper: "#FFFFFF"
  line: "#DCE2EA"
  primary: "#4F46E5"
  emerald: "#087F5B"
  violet: "#6D3FC0"
  warning: "#B85C00"
  danger: "#C93737"
typography:
  display:
    fontFamily: "Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
  sans:
    fontFamily: "Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
  data:
    fontFamily: "'IBM Plex Sans KR', Pretendard, 'Noto Sans KR', sans-serif"
rounded:
  sm: "0.375rem"
  DEFAULT: "0.75rem"
  lg: "1rem"
spacing:
  inline: "0.5rem"
  component: "1.25rem"
  section: "4rem"
components:
  button:
    backgroundColor: "#4F46E5"
    textColor: "#FFFFFF"
    rounded: "0.75rem"
    height: "2.75rem"
  card:
    backgroundColor: "#FFFFFF"
    textColor: "#0B1C30"
    rounded: "1rem"
  status:
    backgroundColor: "#F8F9FF"
    textColor: "#0B1C30"
    rounded: "0.375rem"
---

# Bonda Design System

## Overview

### North Star

Bonda는 투자 결론을 화려하게 제시하는 AI dashboard가 아니라, 개인 채권 투자자가 매수 이후 달라진 사실을 원문까지 추적하는 **신용 변화 관제 기록지**다. 랜딩은 서비스를 이해시키는 brand surface이고, `/monitoring`과 상세 route는 반복 사용하는 product surface다.

### Signature

제품의 고유한 시각 언어는 `검증 원문 → deterministic 계산 → 제한적 AI 해석`을 잇는 세 단계 rail이다. `primary` indigo는 원문, emerald는 계산, violet은 해석에만 사용한다. 이 세 색을 장식용 카드 색으로 흩뿌리지 않는다.

### Anti-references

- 근거 없이 안전을 약속하는 투자 광고
- 숫자와 gradient가 경쟁하는 generic SaaS dashboard
- 모든 문장을 badge와 card에 가두는 AI 생성 UI
- AI 해석을 공식 위험 상태보다 크게 보이는 화면

## Colors

`canvas`는 전체 배경, `paper`는 실제 작업 surface다. `ink`와 `muted`가 대부분의 화면을 구성하고 `line`이 구조를 나눈다. Indigo, emerald, violet은 세 정보 계층에만 쓴다. `warning`과 `danger`는 제품 상태이며 브랜드 색과 섞지 않는다. 색만으로 의미를 전달하지 않고 항상 텍스트를 함께 둔다.

## Typography

한국어 가독성을 위해 설치 의존성이 없는 sans stack을 기본으로 한다. Display는 랜딩의 핵심 문장과 화면 제목 한 곳에만 사용한다. 본문은 15–17px, line-height 1.6 이상이다. 금액, 등급, 날짜, 비율은 data role과 tabular numerals를 쓴다. 영문 eyebrow는 사용하지 않으며 내부 용어보다 사용자가 이해하는 한국어를 우선한다.

## Layout

랜딩은 최대 1180px 단일 흐름이고, 실제 리포트 미리보기가 hero의 증거 역할을 한다. 모니터링 화면은 desktop에서 320px 채권 목록과 유동적인 detail pane을 사용한다. 900px 아래에서는 채권 목록을 상단 선택 영역으로 바꾸고 document scroll을 유지한다. 상세 route는 최대 1040px다.

Runtime token의 canonical owner는 `frontend/src/styles.css`의 `:root`다. 이 문서의 값과 CSS 변수는 같은 변경에서 갱신한다.

## Elevation & Depth

정적 section은 border와 배경 차이로 구분한다. Shadow는 header, 열려 있는 dialog, 떠 있는 toast에만 제한한다. 중첩 card마다 shadow를 추가하지 않는다.

## Shapes

기본 radius는 12px, 큰 dialog와 핵심 preview는 16px이다. Status는 6px의 작은 label 형태다. 모든 버튼과 badge를 pill로 만들지 않는다.

## Components

### Navigation

랜딩과 제품 navigation은 같은 wordmark와 높이를 공유한다. Desktop은 텍스트 nav, mobile은 핵심 destination만 유지한다. 현재 위치를 색과 underline/배경으로 함께 표시한다.

### Three-layer rail

원문, 계산, AI 해석 순서가 실제 읽기 순서와 DOM 순서에 일치한다. 각 단계는 역할명과 설명을 가지며 AI 단계에는 반드시 `참고 해석` 표기를 둔다.

### Buttons and feedback

Primary는 실제 다음 행동 하나에만 사용한다. 아직 연동되지 않은 결제·인증·외부 알림은 `데모` 또는 `연동 준비 중`으로 표시하고 성공했다고 알리지 않는다. Toast는 공통 live region 하나만 사용한다.

### Dialogs and forms

Dialog는 focus 이동·trap·Escape·복귀를 지원한다. Product form은 `noValidate`와 inline error를 사용한다. 현재 select와 date의 popup은 OS 소유를 허용하는 native variant다.

### Data states

모든 API surface는 초기 loading, background refresh, ready, empty, stale, error를 구분한다. Loader와 feedback 영역의 높이를 예약해 layout shift를 줄인다.

## Do's and Don'ts

- Do: 출처, 기준일, 단위, 정책 version을 숫자와 함께 표시한다.
- Do: API가 없는 기능도 끝까지 체험 가능한 데모 상태를 제공한다.
- Do: 데모와 실제 저장 결과를 명확히 구분한다.
- Don't: `100%`, `무조건 안전`, `1초 긴급`, `AI가 원금을 지킨다` 같은 검증 불가능한 약속을 쓴다.
- Don't: 원문 사실, 계산 결과, AI 해석을 같은 색과 같은 위계로 보인다.
- Don't: 장식용 gradient, emoji toast, 반복적인 영어 label을 사용한다.
