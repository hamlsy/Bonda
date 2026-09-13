import { BondItem } from '../types';

export const INITIAL_BONDS: Record<string, BondItem> = {
  lotte: {
    id: 'lotte',
    symbol: 'LT',
    name: '롯데케미칼 59-1',
    company: '롯데케미칼',
    rating: 'AA / 부정적',
    ratingStatus: 'danger',
    maturity: '잔존 1년 4개월',
    coupon: '표면이율 4.82%',
    amount: '발행규모 3,500억 원',
    type: '무보증 공모 회사채',
    simulatedBuyDate: '2023.11.14 (AA 안정적)',
    riskDelta: '+24.8% 위험 상승',
    riskTrend: 'up',
    alertText: '🚨 [주의 감지] 롯데케미칼: 나이스신용평가 무보증사채 등급전망 ‘부정적(Negative)’ 검토',
    alertLevel: 'danger',
    fact: {
      title: 'DART 수시공시 주요사항보고서',
      source: 'DART 수시공시',
      quote: '"중국발 석유화학 증설에 따른 에틸렌 스프레드 회복 지연 및 일진머티리얼즈(현 롯데에너지머티리얼즈) 인수로 인한 차입금 총액 2.4조 원 증가"',
      filingDate: '2024.03.18 17:21',
      filingNumber: '20240318000419',
      verifiedPercent: 100,
      detailedDARTExcerpt: `[금융감독원 전자공시시스템 원문 발췌]
문서번호: 20240318000419
제출인: 롯데케미칼 주식회사
보고사항: 타법인 주식 및 출자증권 취득 결정 및 차입금 현황 변경
내용 요약: 당사는 이차전지 소재 사업 확장을 위해 일진머티리얼즈 인수를 최종 완료하였으며, 인수금융 조달(2조 4,000억 원)에 따라 연결기준 총차입금이 전기 대비 32.8% 증가하였습니다. 또한 중국 에틸렌 신증설 물량 출회로 화학 시황 회복이 지연됨에 따라 분기 영업이익률이 감소하였습니다.`
    },
    formula: {
      interestCover: '-0.8배 (위험)',
      interestCoverPercent: 25,
      interestCoverStatus: '이자보상배율 (영업익/이자비용)',
      isInterestCoverDanger: true,
      debtRatio: '5.4배 (기준 3.5배 초과)',
      debtRatioPercent: 78,
      debtRatioStatus: '순차입금 / EBITDA',
      formulaExpr: '수식: EBIT ÷ 총이자비용',
      verificationText: '환각 배제 100%'
    },
    insight: {
      badge: 'Bonda AI 모델',
      summary: '"계열사 지원 여력 및 3.2조 원 규모 유동성 보유로 단기 부도 가능성은 매우 희박합니다. 다만 등급 강등 시 채권 유통가격 하락 가능성이 있으므로, 만기까지 확정 이자를 수취하는 전략이 유리합니다."',
      strategy: '만기까지 확정 이자를 수취하는 전략',
      disclaimer: '* 본 해석은 AI가 생성한 참고 정보이며 법적 투자권유가 아닙니다.'
    },
    debtDelta: {
      buyRatio: 148,
      currentRatio: 186.4,
      delta: '▲ +38.4%p'
    },
    recentFeeds: [
      { title: 'DART 분기보고서 부채현황 공시', time: '10분 전', source: 'DART' },
      { title: 'NICE신평 등급 아웃룩 코멘트 (부정적 유지)', time: '2시간 전', source: 'NICE신용평가' },
      { title: '한국기업평가 회사채 정기평가 보고서 발행', time: '1일 전', source: '한국기업평가' }
    ]
  },
  hyundai: {
    id: 'hyundai',
    symbol: 'HC',
    name: '현대카드 801-2',
    company: '현대카드',
    rating: 'AA+ / 안정적',
    ratingStatus: 'stable',
    maturity: '잔존 2년 1개월',
    coupon: '표면이율 3.95%',
    amount: '발행규모 2,000억 원',
    type: '원화 무보증사채',
    simulatedBuyDate: '2023.10.05 (AA+ 안정적)',
    riskDelta: '-1.2% 위험 완화',
    riskTrend: 'safe',
    alertText: '✅ [양호 유지] 현대카드: 현대자동차 계열 지원 가능성 및 연체율 방어 우수',
    alertLevel: 'safe',
    fact: {
      title: 'DART 분기보고서 (여신전문금융회사)',
      source: 'DART 정기공시',
      quote: '"신용판매 취급고 역대 최대치 경신 및 현대차그룹 판매 호조에 따른 captive 금융 시너지 유지 (DART 분기보고서 발췌)"',
      filingDate: '2024.04.02 11:45',
      filingNumber: '20240402000182',
      verifiedPercent: 100,
      detailedDARTExcerpt: `[금융감독원 전자공시시스템 원문 발췌]
문서번호: 20240402000182
제출인: 현대카드 주식회사
보고사항: 분기 실적 및 자산건전성 현황
내용 요약: 당사의 1분기 신용판매 취급액은 전년 동기 대비 8.4% 증가한 38조 2,000억 원을 기록하였으며, 1개월 이상 실질 연체율은 0.98%로 동종 업계 최저 수준을 유지하고 있습니다. 애플페이 도입 효과 및 현대차·기아 PLCC 이용률 확대로 수익성이 안정적으로 유지되고 있습니다.`
    },
    formula: {
      interestCover: '2.8배 (안전권)',
      interestCoverPercent: 75,
      interestCoverStatus: '이자보상배율 (조정수익/이자비용)',
      isInterestCoverDanger: false,
      debtRatio: '2.1배 (양호)',
      debtRatioPercent: 40,
      debtRatioStatus: '레버리지 배율 (총자산/자기자본)',
      formulaExpr: '수식: 영업이익 ÷ 금융비용',
      verificationText: '환각 배제 100%'
    },
    insight: {
      badge: 'Bonda AI 모델',
      summary: '"조달금리 상승 구간에도 불구하고 우수한 리스크 관리로 대손비용 통제 중입니다. 부도 위험 극히 미미하며 만기 원리금 수취 확률 99.9%로 평가됩니다."',
      strategy: '만기 확정 금리 수취 및 안정적 이자 수익 보유',
      disclaimer: '* 본 해석은 AI가 생성한 참고 정보이며 법적 투자권유가 아닙니다.'
    },
    debtDelta: {
      buyRatio: 5.2,
      currentRatio: 4.8,
      delta: '▼ -0.4배'
    },
    recentFeeds: [
      { title: '한국신용평가 현대카드 무보증사채 AA+ 안정적 확인', time: '1일 전', source: '한국신용평가' },
      { title: '금감원 1분기 카드사 연체율 동향 발표', time: '3일 전', source: 'DART' },
      { title: '현대카드 제801회 원리금 정상 상환 완료 공시', time: '5일 전', source: 'KSD예탁원' }
    ]
  },
  kia: {
    id: 'kia',
    symbol: 'KIA',
    name: '기아 340-2',
    company: '기아',
    rating: 'AAA / 안정적',
    ratingStatus: 'positive',
    maturity: '잔존 3년 2개월',
    coupon: '표면이율 3.65%',
    amount: '발행규모 4,000억 원',
    type: '무보증사채 (ESG 녹색채권)',
    simulatedBuyDate: '2023.08.19 (AA+ 긍정적)',
    riskDelta: '-4.5% 최고 안전',
    riskTrend: 'safe',
    alertText: '🛡️ [최우수 안전] 기아: 3대 신평사 신용등급 역대 최고 등급 AAA 일제 상향',
    alertLevel: 'positive',
    fact: {
      title: '한국기업평가 신용평가 본보고서',
      source: '3대 신평사 공시',
      quote: '"글로벌 하이브리드/EV 호조로 영업이익률 12% 상회, 순현금 14조 원 이상 보유 상태 지속 (한기평 본평가서 발췌)"',
      filingDate: '2024.04.15 09:30',
      filingNumber: '20240415000882',
      verifiedPercent: 100,
      detailedDARTExcerpt: `[한국기업평가 신용평가전문 원문]
대상: 기아 주식회사 제340-2회 무보증사채
신용등급: AAA (안정적) - 종전 AA+(긍정적)에서 1단계 상향 조정
평가 근거: 미국 및 유럽 시장 내 고수익 RV 및 HEV 판매 믹스 개선으로 연간 영업이익 11조 원 상회, 총차입금을 상회하는 14조 2천억 원의 실질 순현금 보유 구조로 인해 상환 불능 가능성이 전무함.`
    },
    formula: {
      interestCover: '28.4배 (최우수)',
      interestCoverPercent: 95,
      interestCoverStatus: '이자보상배율 (EBIT/금융이자)',
      isInterestCoverDanger: false,
      debtRatio: '0.2배 (실질 무차입)',
      debtRatioPercent: 15,
      debtRatioStatus: '순차입금 / EBITDA',
      formulaExpr: '수식: EBIT ÷ 총이자비용',
      verificationText: '환각 배제 100%'
    },
    insight: {
      badge: 'Bonda AI 모델',
      summary: '"사실상의 무차입 경영 상태로 대한민국 최고 수준의 원리금 상환 안정성을 확보하고 있습니다. 만기 보유 시 원금 손실 위험은 제로에 수렴합니다."',
      strategy: '최우량 AAA 등급 확정 보유 전략 추천',
      disclaimer: '* 본 해석은 AI가 생성한 참고 정보이며 법적 투자권유가 아닙니다.'
    },
    debtDelta: {
      buyRatio: 88,
      currentRatio: 72,
      delta: '▼ -16.0%p'
    },
    recentFeeds: [
      { title: '3대 신평사 기아 회사채 AAA 등급 확정 발표', time: '3시간 전', source: '한신평' },
      { title: '글로벌 북미 판매 실적 역대 최대 경신 공시', time: '1일 전', source: 'DART' },
      { title: 'ESG 녹색채권 투자자 안내문 공시', time: '4일 전', source: 'DART' }
    ]
  },
  hanwha: {
    id: 'hanwha',
    symbol: 'HA',
    name: '한화에어로스페이스 71',
    company: '한화에어로스페이스',
    rating: 'AA- / 긍정적',
    ratingStatus: 'positive',
    maturity: '잔존 1년 10개월',
    coupon: '표면이율 4.15%',
    amount: '발행규모 2,500억 원',
    type: '무보증 공모사채',
    simulatedBuyDate: '2024.01.10 (AA- 안정적)',
    riskDelta: '+8.1% 개선 중',
    riskTrend: 'positive',
    alertText: '📈 [등급상향 검토] 한화에어로: K9 자주포 및 천무 수주잔고 급증에 따른 현금흐름 대폭 개선',
    alertLevel: 'positive',
    fact: {
      title: 'NICE신용평가 수시평가 코멘트',
      source: 'NICE신용평가',
      quote: '"폴란드 및 루마니아 대규모 방산 수주 잔고 30조 원 확보로 중장기 EBITDA 창출능력 비약적 신장 (신평사 코멘트)"',
      filingDate: '2024.04.10 14:10',
      filingNumber: '20240410000318',
      verifiedPercent: 100,
      detailedDARTExcerpt: `[NICE신용평가 신용전망 코멘트]
대상: 한화에어로스페이스 제71회 무보증사채
등급전망: '안정적'에서 '긍정적(Positive)'으로 상향
평가 근거: 폴란드 K-9 자주포 2차 이행계약 및 천무 다연장로켓 수주잔고가 30조 원을 돌파함에 따라 향후 3개년 평균 영업현금흐름(OCF)이 연간 1.5조 원 수준으로 대폭 확대될 전망. 중장기적으로 AA 본등급 복귀 가능성 높음.`
    },
    formula: {
      interestCover: '4.6배 (건전)',
      interestCoverPercent: 82,
      interestCoverStatus: '이자보상배율 (영업익/이자비용)',
      isInterestCoverDanger: false,
      debtRatio: '2.8배 (안정)',
      debtRatioPercent: 50,
      debtRatioStatus: '순차입금 / EBITDA',
      formulaExpr: '수식: EBIT ÷ 총이자비용',
      verificationText: '환각 배제 100%'
    },
    insight: {
      badge: 'Bonda AI 모델',
      summary: '"수주 사업 특성상 운전자본 부담이 있으나, 선수금 유입 및 확정 마진으로 인해 향후 1~2년 내 AA 등급으로의 등급 상향 가능성이 유력합니다."',
      strategy: '등급 상향 시 자본차익(매매차익) 실현 or 만기 보유 병행 가능',
      disclaimer: '* 본 해석은 AI가 생성한 참고 정보이며 법적 투자권유가 아닙니다.'
    },
    debtDelta: {
      buyRatio: 220,
      currentRatio: 178,
      delta: '▼ -42.0%p'
    },
    recentFeeds: [
      { title: '방위사업청 루마니아 K9 수출계약 체결 공시', time: '40분 전', source: 'DART' },
      { title: '신평 3사 등급전망 Positive 일제 부여', time: '1일 전', source: '한기평' },
      { title: '인적분할 후 존속법인 부채비율 감축 공시', time: '3일 전', source: 'DART' }
    ]
  },
  sk: {
    id: 'sk',
    symbol: 'SK',
    name: 'SK하이닉스 218-1',
    company: 'SK하이닉스',
    rating: 'AA / 긍정적',
    ratingStatus: 'positive',
    maturity: '잔존 2년 6개월',
    coupon: '표면이율 3.88%',
    amount: '발행규모 5,000억 원',
    type: '무보증 회사채',
    simulatedBuyDate: '2023.12.01 (AA 부정적)',
    riskDelta: '-12.0% 리스크 급감',
    riskTrend: 'safe',
    alertText: '🚀 [턴어라운드] SK하이닉스: HBM3E 공급 독점으로 흑자전환 및 잉여현금흐름 극대화',
    alertLevel: 'positive',
    fact: {
      title: 'DART 분기보고서 영업실적 공시',
      source: 'DART 정기공시',
      quote: '"AI 반도체 수요 폭증에 따른 분기 영업이익 7조 돌파 및 순차입금 상환 개시 (공시 3분기 실적)"',
      filingDate: '2024.04.25 09:00',
      filingNumber: '20240425000219',
      verifiedPercent: 100,
      detailedDARTExcerpt: `[금융감독원 전자공시시스템 원문 발췌]
문서번호: 20240425000219
제출인: 에스케이하이닉스 주식회사
보고사항: 분기 실적 공시 및 재무건전성 안내
내용 요약: 글로벌 AI 데이터센터용 HBM3E 공급 호조로 전 분기 대비 흑자 규모가 대폭 확대되었습니다. 1분기 잉여현금흐름(FCF) 약 4.2조 원이 발생하여 만기 도래 회사채 및 단기차입금 2.1조 원을 현금 상환 완료하였습니다.`
    },
    formula: {
      interestCover: '8.9배 (매우 우수)',
      interestCoverPercent: 90,
      interestCoverStatus: '이자보상배율 (영업익/이자비용)',
      isInterestCoverDanger: false,
      debtRatio: '1.4배 (급속 축소)',
      debtRatioPercent: 30,
      debtRatioStatus: '순차입금 / EBITDA',
      formulaExpr: '수식: EBIT ÷ 총이자비용',
      verificationText: '환각 배제 100%'
    },
    insight: {
      badge: 'Bonda AI 모델',
      summary: '"작년 반도체 다운턴 시기 축적되었던 차입금이 빠르게 해소되고 있습니다. 회사채 투자자에게 가장 안전한 채권 중 하나로 복귀했습니다."',
      strategy: '만기 안정 보유 적극 권장',
      disclaimer: '* 본 해석은 AI가 생성한 참고 정보이며 법적 투자권유가 아닙니다.'
    },
    debtDelta: {
      buyRatio: 52,
      currentRatio: 38,
      delta: '▼ -14.0%p'
    },
    recentFeeds: [
      { title: 'AI향 HBM3E 차세대 물량 완판 및 공급 공시', time: '15분 전', source: 'DART' },
      { title: '신평사 등급 아웃룩 안정적에서 긍정적 전환', time: '2일 전', source: 'NICE신용평가' },
      { title: '회사채 제218회 이자 정상 지급 통지', time: '1주일 전', source: 'KSD예탁원' }
    ]
  },
  koreanair: {
    id: 'koreanair',
    symbol: 'KE',
    name: '대한항공 101-1',
    company: '대한항공',
    rating: 'A- / 안정적',
    ratingStatus: 'stable',
    maturity: '잔존 1년 1개월',
    coupon: '표면이율 4.45%',
    amount: '발행규모 1,800억 원',
    type: '무보증 공모사채',
    simulatedBuyDate: '2024.02.15 (BBB+ 긍정적)',
    riskDelta: '-6.4% 위험 완화',
    riskTrend: 'safe',
    alertText: '✈️ [여객 정상화] 대한항공: 아시아나 합병 승인 가시화 및 국제선 여객 호조',
    alertLevel: 'safe',
    fact: {
      title: 'DART 영업실적 보고서',
      source: 'DART 공시',
      quote: '"국제선 장거리 노선 회복 및 화물 부문 방어로 분기 영업이익률 9.8% 달성, 순부채비율 200% 이하 안정세 안착"',
      filingDate: '2024.04.18 10:15',
      filingNumber: '20240418000109',
      verifiedPercent: 100,
      detailedDARTExcerpt: `[금융감독원 전자공시시스템 발췌]
보고서명: 분기보고서
제출인: 주식회사 대한항공
내용 요약: 미주 및 유럽 여객 수요의 견조한 유지로 분기 매출 3조 8,000억 원을 달성하였습니다. 아시아나항공 기업결합 승인이 마무리 단계에 접어들었으며 차입금 상환 기조를 유지하여 재무구조가 개선되었습니다.`
    },
    formula: {
      interestCover: '3.4배 (안전권)',
      interestCoverPercent: 78,
      interestCoverStatus: '이자보상배율 (EBIT/금융이자)',
      isInterestCoverDanger: false,
      debtRatio: '2.5배 (건전)',
      debtRatioPercent: 45,
      debtRatioStatus: '순차입금 / EBITDA',
      formulaExpr: '수식: EBIT ÷ 총이자비용',
      verificationText: '환각 배제 100%'
    },
    insight: {
      badge: 'Bonda AI 모델',
      summary: '"항공업계의 고금리 부담에도 불구하고 탄탄한 여객 캐시카우로 이자지급능력이 충분합니다. 1년 남은 만기까지 무난한 원리금 회수가 예상됩니다."',
      strategy: '만기 원리금 수취 보유',
      disclaimer: '* 본 해석은 AI가 생성한 참고 정보이며 법적 투자권유가 아닙니다.'
    },
    debtDelta: {
      buyRatio: 260,
      currentRatio: 195,
      delta: '▼ -65.0%p'
    },
    recentFeeds: [
      { title: 'EU 및 미국 경쟁당국 기업결합 최종 승인 임박', time: '2시간 전', source: 'DART' },
      { title: '한국신용평가 대한항공 회사채 A- 안정적 부여', time: '1일 전', source: '한신평' }
    ]
  }
};

export const COMPARISON_TABLE_DATA = [
  {
    criterion: '공시 모니터링 방식',
    legacy: 'DART 사이트에 수시로 직접 들어가 수백 페이지 사업보고서 열람',
    bonda: '핵심 신용 재무 변동만 자동 발췌 후 알림'
  },
  {
    criterion: '전문 리포트 해석',
    legacy: '신평사 전문 용어(EBITDA, Net Debt)와 난해한 금융 문장으로 포기',
    bonda: '초보자도 1초 만에 이해하는 쉬운 한국어 AI 번역 요약'
  },
  {
    criterion: '리스크 감지 속도',
    legacy: '신용등급 강등 기사가 네이버에 뜬 후에야 뒤늦게 손실 인지',
    bonda: '등급 전망(Outlook) 변동 선제 감지로 매도/보유 대응 골든타임 확보'
  },
  {
    criterion: 'AI 신뢰도 & 객관성',
    legacy: '일반 챗봇의 그럴듯한 거짓말(할루시네이션) 위험',
    bonda: '원문-정량식-해석 3단계 분리 투명성 원칙으로 100% 신뢰 검증'
  }
];

export const FREQUENT_BONDS = [
  { name: '롯데케미칼 59-1', key: 'lotte', rating: 'AA / 부정적' },
  { name: '현대카드 801-2', key: 'hyundai', rating: 'AA+ / 안정적' },
  { name: '기아 340-2', key: 'kia', rating: 'AAA / 안정적' },
  { name: '한화에어로스페이스 71', key: 'hanwha', rating: 'AA- / 긍정적' },
  { name: 'SK하이닉스 218-1', key: 'sk', rating: 'AA / 긍정적' },
  { name: '대한항공 101-1', key: 'koreanair', rating: 'A- / 안정적' }
];
