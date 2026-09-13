export type DemoBond = {
  id: string;
  issuer: string;
  name: string;
  rating: string;
  maturity: string;
  coupon: string;
  state: "정상" | "관찰" | "주의";
  fact: string;
  source: string;
  calculation: string;
  interpretation: string;
};

export const demoBonds: DemoBond[] = [
  {
    id: "lotte",
    issuer: "롯데케미칼",
    name: "롯데케미칼 59-1",
    rating: "AA / 안정적",
    maturity: "2027. 02. 17.",
    coupon: "4.10%",
    state: "관찰",
    fact: "분기보고서에서 연결 기준 순차입금 증가가 확인되었습니다.",
    source: "2026년 1분기보고서 · DART 예시",
    calculation: "직전 비교기간 대비 총차입금 12.4% 증가",
    interpretation: "차입 부담이 커졌지만 이 사실만으로 상환 가능성 저하를 단정할 수 없습니다.",
  },
  {
    id: "korean-air",
    issuer: "대한항공",
    name: "대한항공 101",
    rating: "A+ / 안정적",
    maturity: "2028. 06. 12.",
    coupon: "4.35%",
    state: "정상",
    fact: "최근 검증된 유동성 경고 공시는 확인되지 않았습니다.",
    source: "최근 공개 공시 기준 · 데모",
    calculation: "현금흐름·부채 부담 임계값 미도달",
    interpretation: "현재 확인 범위에서는 별도 주의 신호가 없습니다. 이후 공시는 계속 확인해야 합니다.",
  },
  {
    id: "cgv",
    issuer: "CJ CGV",
    name: "CJ CGV 35",
    rating: "A- / 부정적",
    maturity: "2027. 10. 30.",
    coupon: "5.20%",
    state: "주의",
    fact: "신용등급 전망 변경과 채무보증 증가가 함께 확인되었습니다.",
    source: "등급 공시·사업보고서 · 데모",
    calculation: "신용·부채 부담 두 범주가 주의 임계값 도달",
    interpretation: "두 변화가 같은 기간에 나타났으므로 이후 현금흐름과 추가 공시를 우선 확인할 필요가 있습니다.",
  },
];

export const roadmapItems = [
  ["인증과 계정", "카카오·Google·이메일 로그인과 사용자별 포트폴리오"],
  ["외부 알림", "알림 조건 저장, 연락처 인증, 카카오·이메일 발송 이력"],
  ["구독과 결제", "요금제, 결제, 해지·환불과 사용량 정책"],
  ["분석 확장", "직접 공시 분석, 재분석 실행 상태, 근거가 연결된 추가 질문"],
] as const;
