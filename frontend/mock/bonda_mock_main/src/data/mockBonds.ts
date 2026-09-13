import { CorporateBond } from '../types';

export const MOCK_BONDS: CorporateBond[] = [
  {
    id: 'lotte-chem-59-2',
    name: '롯데케미칼 59-2',
    issuer: '롯데케미칼',
    ticker: '011170',
    sector: '석유화학',
    rating: 'AA-',
    ratingAgency: '한국기업평가 · NICE신용평가',
    outlook: '부정적',
    issueDate: '2023-04-12',
    maturityDate: '2026-04-12',
    remainingDays: 420,
    couponRate: 4.45,
    ytm: 5.35,
    creditSpreadBps: 185,
    spreadChange30d: 32,
    issueAmount: '2,500억원',
    parValue: 10000,
    marketPrice: 9780,
    riskLevel: 'ALERT',
    riskSignals: [
      {
        id: 'sig-1',
        type: 'alert',
        title: '신용등급 하향 아웃룩(부정적) 유지',
        description: '국내 3대 신용평가사 모두 석유화학 스프레드 악화 및 순차입금 확대를 이유로 AA-(부정적) 부여.',
        date: '2024-11-28',
        metricTrigger: '순차입금/EBITDA 8.9배 (기준치 5.0배 초과)',
      },
      {
        id: 'sig-2',
        type: 'alert',
        title: '사채관리계약 재무비율 특약 미준수 이슈 발생',
        description: '부채비율 및 이자보상배율 유지 특약(3개년 누적 EBITDA/이자비용 5배) 일시 미달로 사채권자집회 소집.',
        date: '2024-12-05',
        metricTrigger: '최근 3개년 누적 EBITDA/이자비용 4.3배',
      },
      {
        id: 'sig-3',
        type: 'positive',
        title: '롯데월드타워 지분 담보 제공 및 특약 해소 가결',
        description: '롯데물산 보유 지분 및 부동산을 사채권자에게 담보로 제공하는 안건이 집회에서 98.4% 찬성 통과.',
        date: '2024-12-21',
      },
    ],
    rawFacts: {
      disclosures: [
        {
          id: 'df-1',
          date: '2024-12-21',
          title: '[DART 공시] 사채권자집회 결과(원안 가결)',
          source: 'DART 전자공시',
          originalQuote:
            '제59-2회 무보증사채의 사채관리계약서 제2-2조(재무비율 등의 유지) 특약 위반 우려 조항을 삭제하고, 당사가 보유한 롯데물산(주) 발행 보통주식 1,500,000주(평가액 6,250억원 상당)를 신탁 담보로 제공하는 변경 계약 체결의 건이 가결되었습니다.',
          isKeyTrigger: true,
          documentNumber: '20241221000342',
        },
        {
          id: 'df-2',
          date: '2024-11-27',
          title: '[평가원문] 한국기업평가 정기 신용평가 의견서',
          source: '신평사 평가서',
          originalQuote:
            '중국발 대규모 증설로 인한 에틸렌/PE 마진 위축이 장기화되고 있으며, 롯데에너지머티리얼즈 인수(2.7조원)에 따른 자금소요로 순차입금이 2021년 말 -1.3조원에서 2024년 3분기 말 6.5조원으로 급증하였습니다.',
          isKeyTrigger: true,
        },
        {
          id: 'df-3',
          date: '2024-11-14',
          title: '[감사보고서] 분기보고서 주석 18. 우발채무 및 약정사항',
          source: '감사보고서 주석',
          originalQuote:
            '보고기간종료일 현재 당사는 해외 합작법인(LACC LLC 등)의 차입금과 관련하여 미화 820백만달러 상당의 자금보충약정(Equity Support Agreement)을 제공하고 있습니다.',
        },
      ],
      auditOpinion: {
        opinion: '적정',
        auditor: '삼일회계법인',
        fiscalYear: '2024년 3분기 검토',
        emphasisOfMatter:
          '석유화학 시황 악화에 따른 영업손실 발생 및 재무약정 미준수에 대한 사채권자집회 가결 결과를 주석 29에 기재하였음.',
      },
      contingentLiabilities: {
        totalGuarantees: '1조 1,250억원 (해외 합작사 자금보충약정 포함)',
        pledgedAssets: '롯데물산 주식 150만주 (담보설정액 6,250억원)',
        litigationRisk: '정상영업 중 통상적 소송 5건 (소송가액 180억원, 패소 시 영향 제한적)',
      },
    },
    deterministicMetrics: {
      interestCoverageRatio: -0.82,
      interestCoverageFormula: '영업손익 (-1,240억원) ÷ 이자비용 (1,512억원) = -0.82배',
      interestCoverageStatus: 'danger',

      debtToEquityRatio: 78.4,
      debtToEquityFormula: '총부채 (11조 4,300억원) ÷ 자기자본 (14조 5,800억원) = 78.4%',
      debtToEquityStatus: 'healthy',

      netDebtToEbitda: 8.92,
      netDebtToEbitdaFormula: '순차입금 (6조 5,200억원) ÷ EBITDA (7,310억원) = 8.92배',
      netDebtToEbitdaStatus: 'danger',

      currentRatio: 132.5,
      currentRatioFormula: '유동자산 (7조 1,200억원) ÷ 유동부채 (5조 3,740억원) = 132.5%',
      currentRatioStatus: 'healthy',

      borrowingDependence: 36.8,
      borrowingDependenceFormula: '총차입금 (9조 5,700억원) ÷ 총자산 (26조 100억원) = 36.8%',
      borrowingDependenceStatus: 'caution',

      altmanZScore: 1.74,
      altmanZInterpretation: '회색/경계 권역 (부도위험 직접 발생 확률은 낮으나 재무유연성 축소)',

      shortTermDebtRatio: 42.1,
    },
    aiInsights: {
      summary:
        '사채권자집회를 통해 롯데물산 알짜 지분을 담보로 확보함으로써 59-2회 채권의 만기 부도 리스크는 실질적으로 차단되었습니다. 다만 석유화학 사이클 둔화로 인한 신용등급 하향(A+로 강등) 위험이 존재하므로 만기 전 장내 매도 시 단가 하락 가능성을 염두에 두어야 합니다.',
      verdict: '조건부 만기보유 적합 (담보 확보)',
      riskLevel: 'ALERT',
      keyRisks: [
        {
          title: '신용등급 강등 시 채권 가격 하락',
          description: 'AA-에서 A+로 1노치 강등 시 기관 매도 물량 출회로 장내 채권 단가가 9,700원 밑으로 하락할 수 있습니다.',
          severity: 'warning',
        },
        {
          title: '해외 자회사 자금보충약정 부담',
          description: 'LACC 등 북미 에탄크래커 법인의 가동률 저하 시 추가 자금 투입 요청이 발생할 수 있습니다.',
          severity: 'info',
        },
        {
          title: '대규모 CAPEX 회수 지연',
          description: '인도네시아 라인 프로젝트(LINE Project) 완공 전까지 추가 차입금 상환 여력이 제한적입니다.',
          severity: 'warning',
        },
      ],
      debtServicingCapacity: {
        assessment: '보통 (Adequate) - 그룹 지원 및 담보 보강',
        cashAndEquivalentsNote: '현금 및 금융자산 약 2조 3,000억원 보유로 1년 내 만기도래 회사채 상환 여력은 충분합니다.',
        refinancingFeasibility: '담보채권 전환 및 롯데지주의 유동성 확약으로 리파이낸싱 실패 가능성은 매우 낮음.',
      },
      retailInvestorGuidance: [
        '만기까지 1년 2개월 남은 채권으로, 연 5.3%대 만기수익률(YTM)을 확정 수취할 목적인 개인투자자에게는 유효합니다.',
        '중도 매매차익을 노리는 공격적 투자자라면 등급 하향 공시 전 분할 매도를 고려하세요.',
        '롯데그룹 전반의 크레딧 스프레드가 동반 확대 중이므로 동일 그룹 내 채권 비중은 20%를 넘지 않도록 관리하십시오.',
      ],
      generatedAt: '2025-02-20T09:30:00Z',
    },
    timelineEvents: [
      {
        id: 'tl-1',
        date: '2024-06-15',
        eventType: 'RATING_CHANGE',
        title: 'NICE신평, 신용등급 전망 ‘부정적’ 변경',
        summary: '업황 둔화 및 재무부담 누적으로 AA-(안정적)에서 AA-(부정적)으로 아웃룩 하향 조정.',
        impact: 'negative',
        metricChange: '스프레드 +15bp 확대',
      },
      {
        id: 'tl-2',
        date: '2024-09-30',
        eventType: 'FINANCIAL_REPORT',
        title: '3분기 누적 영업손실 1,240억원 기록',
        summary: '기초유분 및 합성수지 스프레드 악화로 이자보상배율 음수 전환.',
        impact: 'negative',
        metricChange: '이자보상배율: 0.2배 → -0.82배',
      },
      {
        id: 'tl-3',
        date: '2024-11-21',
        eventType: 'DISCLOSURE',
        title: '사채관리계약 재무약정 미준수 사유 공시',
        summary: '3개년 EBITDA/이자비용 특약 기준(5배) 미달에 따른 기한이익상실 유예 및 집회 소집.',
        impact: 'negative',
        relatedFactQuote: '사채관리계약 제2조 위반 우려 통보 접수',
      },
      {
        id: 'tl-4',
        date: '2024-12-21',
        eventType: 'DISCLOSURE',
        title: '사채권자집회 담보제공 가결',
        summary: '롯데물산 주식 6,250억원 상당 담보 신탁 완료로 채권자 권리 안전장치 확보.',
        impact: 'positive',
        metricChange: '스프레드 220bp에서 185bp로 안정화',
      },
      {
        id: 'tl-5',
        date: '2025-01-15',
        eventType: 'FINANCIAL_REPORT',
        title: '단기 자금 유동성 확충 계획 공시',
        summary: '보유 부동산 유동화 및 비핵심 자산 매각으로 8,000억원 현금 유입 계획 발표.',
        impact: 'positive',
      },
    ],
  },
  {
    id: 'hanwha-ocean-38',
    name: '한화오션 38',
    issuer: '한화오션 (구 대우조선해양)',
    ticker: '042660',
    sector: '조선 · 방산',
    rating: 'A-',
    ratingAgency: '한국기업평가 · 한국신용평가',
    outlook: '긍정적',
    issueDate: '2023-08-25',
    maturityDate: '2025-08-25',
    remainingDays: 160,
    couponRate: 4.80,
    ytm: 4.52,
    creditSpreadBps: 135,
    spreadChange30d: -24,
    issueAmount: '1,800억원',
    parValue: 10000,
    marketPrice: 10040,
    riskLevel: 'STABLE',
    riskSignals: [
      {
        id: 'sig-h1',
        type: 'positive',
        title: '2조원 유상증자로 부채비율 대폭 개선',
        description: '한화그룹 인수 후 2조원 규모 유상증자가 완료되어 부채비율이 480%에서 278%로 극적 하락.',
        date: '2024-05-10',
        metricTrigger: '부채비율 480% → 278%',
      },
      {
        id: 'sig-h2',
        type: 'positive',
        title: '고수익 LNG 운반선 및 특수선 수주잔고 3년치 확보',
        description: '카타르 에너지 2차 프로젝트 및 미 해군 함정 MRO 수주 체결로 영업이익 흑자 기조 안착.',
        date: '2024-10-18',
      },
      {
        id: 'sig-h3',
        type: 'watch',
        title: '선박 건조용 후판 가격 및 인건비 상승 모니터링',
        description: '국내외 철강사와의 후판 가격 협상 및 숙련공 인건비 상승에 따른 원가율 점검 필요.',
        date: '2024-11-05',
      },
    ],
    rawFacts: {
      disclosures: [
        {
          id: 'df-h1',
          date: '2024-10-29',
          title: '[DART 공시] 단일판매·공급계약 체결 (LNG운반선 4척)',
          source: 'DART 전자공시',
          originalQuote:
            '중동 지역 선주로부터 LNG 운반선 4척을 총 1조 4,320억원에 수주하였으며, 이는 최근 매출액 대비 19.3%에 해당하는 규모입니다. 계약기간은 2028년 12월 31일까지입니다.',
          documentNumber: '20241029000185',
        },
        {
          id: 'df-h2',
          date: '2024-12-02',
          title: '[평가원문] 한국신용평가 신용등급 전망 ‘긍정적’ 부여',
          source: '신평사 평가서',
          originalQuote:
            '한화그룹으로의 피인수 이후 대규모 유상증자를 통해 재무안정성이 본원적으로 제고되었으며, 고선가 선종 중심의 건조 비중 확대로 2025년 이후 본격적인 이익 창출력 확대가 예상되어 신용등급 전망을 ‘긍정적’으로 상향합니다.',
          isKeyTrigger: true,
        },
        {
          id: 'df-h3',
          date: '2024-11-14',
          title: '[감사보고서] 분기보고서 주석 22. 선수금환급보증(RG)',
          source: '감사보고서 주석',
          originalQuote:
            '수주 선박에 대해 수출입은행, 산업은행 등으로부터 발급받은 선수금환급보증(RG) 잔액은 총 7조 8,900억원이며, 계약 취소 등 중대한 불이행 사유는 발생하지 않았습니다.',
        },
      ],
      auditOpinion: {
        opinion: '적정',
        auditor: '삼정회계법인',
        fiscalYear: '2024년 3분기 검토',
        emphasisOfMatter: '유상증자 완료로 계속기업 관련 불확실성 사유가 완전히 해소되었음을 강조함.',
      },
      contingentLiabilities: {
        totalGuarantees: '선수금환급보증(RG) 7조 8,900억원 (조선업 정상영업 보증)',
        pledgedAssets: '거제 옥포조선소 야드 및 독 설비 일부',
        litigationRisk: '구 대우조선해양 시절 분식회계 주주 소송 대부분 충당부채 반영 완료',
      },
    },
    deterministicMetrics: {
      interestCoverageRatio: 2.14,
      interestCoverageFormula: '영업이익 (2,180억원) ÷ 이자비용 (1,018억원) = 2.14배',
      interestCoverageStatus: 'healthy',

      debtToEquityRatio: 278.5,
      debtToEquityFormula: '총부채 (10조 2,300억원) ÷ 자기자본 (3조 6,730억원) = 278.5%',
      debtToEquityStatus: 'caution',

      netDebtToEbitda: 2.35,
      netDebtToEbitdaFormula: '순차입금 (9,400억원) ÷ EBITDA (4,000억원) = 2.35배',
      netDebtToEbitdaStatus: 'healthy',

      currentRatio: 118.2,
      currentRatioFormula: '유동자산 (5조 6,100억원) ÷ 유동부채 (4조 7,460억원) = 118.2%',
      currentRatioStatus: 'healthy',

      borrowingDependence: 21.4,
      borrowingDependenceFormula: '총차입금 (2조 9,800억원) ÷ 총자산 (13조 9,030억원) = 21.4%',
      borrowingDependenceStatus: 'healthy',

      altmanZScore: 2.48,
      altmanZInterpretation: '회색지대 상단 (턴어라운드 진입, 부도위험 극히 미미)',

      shortTermDebtRatio: 28.5,
    },
    aiInsights: {
      summary:
        '한화그룹 편입 및 2조원 증자로 신용 리스크가 구조적으로 탈피되었습니다. 잔여 만기가 160일로 짧고, 현금보유액(1조 8,000억원)이 해당 회차 총 발행액(1,800억원)을 10배 이상 상회하여 만기 상환 안전성이 매우 높습니다.',
      verdict: '만기보유 강력 적합 (안전)',
      riskLevel: 'STABLE',
      keyRisks: [
        {
          title: '선박 인도 지연 시 지체상금(LD)',
          description: '숙련 인력 수급 불균형으로 인한 일부 공정 지연 시 지체보상금 발생 여부 확인 필요.',
          severity: 'info',
        },
        {
          title: '조선용 후판 강재 가격 변동',
          description: '중국산 후판 반덤핑 관세 부과 시 원가율 상승 요인이 될 수 있습니다.',
          severity: 'info',
        },
      ],
      debtServicingCapacity: {
        assessment: '우수 (Strong)',
        cashAndEquivalentsNote: '현금성자산 1.8조원 및 영업활동현금흐름 흑자로 상환 재원 확실.',
        refinancingFeasibility: '신용등급 A0 상향 검토 중으로 자체 현금 상환 또는 초저금리 차환 용이.',
      },
      retailInvestorGuidance: [
        '만기까지 5개월 남짓 남아 원금 손실 가능성이 극히 희박한 단기 파킹형 채권입니다.',
        '현재 단가가 액면가(10,000원)보다 소폭 높은 10,040원이므로, 표면이자(연 4.8%)와 만기수익률(YTM 4.52%)의 차이를 계산해 매수하세요.',
        '세후 실효수익률 측면에서 단기 금융채/은행 예금 대비 매력적인 분산 수단입니다.',
      ],
      generatedAt: '2025-02-18T14:15:00Z',
    },
    timelineEvents: [
      {
        id: 'tl-h1',
        date: '2023-05-24',
        eventType: 'CAPITAL_INCREASE',
        title: '한화그룹 인수 및 2조원 유상증자 납입',
        summary: '대우조선해양에서 한화오션으로 사명 변경 및 자본확충.',
        impact: 'positive',
      },
      {
        id: 'tl-h2',
        date: '2024-03-20',
        eventType: 'FINANCIAL_REPORT',
        title: '2023년 연간 흑자전환 및 영업이익 달성',
        summary: 'LNG선 건조 비중 상승으로 조업도 정상화.',
        impact: 'positive',
      },
      {
        id: 'tl-h3',
        date: '2024-12-02',
        eventType: 'RATING_CHANGE',
        title: '한신평, 등급전망 ‘A-(긍정적)’ 상향',
        summary: '향후 1년 내 A0 복귀 가능성 제시.',
        impact: 'positive',
      },
    ],
  },
  {
    id: 'sk-eternix-3',
    name: 'SK이터닉스 3',
    issuer: 'SK이터닉스',
    ticker: '475150',
    sector: '신재생에너지 · ESS',
    rating: 'BBB+',
    ratingAgency: '한국신용평가 · NICE신용평가',
    outlook: '안정적',
    issueDate: '2024-06-20',
    maturityDate: '2026-06-20',
    remainingDays: 485,
    couponRate: 6.85,
    ytm: 7.25,
    creditSpreadBps: 380,
    spreadChange30d: 14,
    issueAmount: '800억원',
    parValue: 10000,
    marketPrice: 9910,
    riskLevel: 'WATCH',
    riskSignals: [
      {
        id: 'sig-sk1',
        type: 'watch',
        title: 'BBB+ 등급 특성상 PF 우발채무 연대보증 규모 모니터링',
        description: '풍력 및 태양광 발전소 SPC 프로젝트파이낸싱(PF) 대출 연대보증 1,450억원 존재.',
        date: '2024-11-12',
        metricTrigger: 'PF 연대보증 1,450억원 (자기자본 대비 58%)',
      },
      {
        id: 'sig-sk2',
        type: 'positive',
        title: '한국전력 및 발전공기업 대상 장기 PPA 고정수익 확보',
        description: '20년 장기 전력구매계약(PPA)으로 안정적 현금흐름 창출 구조.',
        date: '2024-09-05',
      },
      {
        id: 'sig-sk3',
        type: 'watch',
        title: '금리 환경에 따른 신규 파이프라인 CAPEX 조달 비용',
        description: '해상풍력 단지 개발을 위한 장기 시설자금 차입 금리 추이 점검 필요.',
        date: '2024-12-10',
      },
    ],
    rawFacts: {
      disclosures: [
        {
          id: 'df-sk1',
          date: '2024-03-04',
          title: '[DART 공시] SK디앤디 인적분할 완료 및 채무 승계',
          source: 'DART 전자공시',
          originalQuote:
            '신설법인 SK이터닉스(주)는 신재생에너지 사업부문을 포괄 승계하며, 분할 전 채무에 대하여 분할존속회사와 연대하여 변제할 책임을 부담합니다.',
          documentNumber: '20240304000412',
        },
        {
          id: 'df-sk2',
          date: '2024-11-14',
          title: '[감사보고서] 분기보고서 주석 15. 특수관계자 거래 및 지급보증',
          source: '감사보고서 주석',
          originalQuote:
            '당사는 풍력발전 사업을 영위하는 (주)신안풍력발전 등의 프로젝트 차입금과 관련하여 1,450억원의 연대보증 및 조건부 채무인수 약정을 제공하고 있습니다.',
        },
        {
          id: 'df-sk3',
          date: '2024-10-15',
          title: '[평가원문] NICE신용평가 본평가 보고서',
          source: '신평사 평가서',
          originalQuote:
            '태양광, 풍력, ESS 등 포트폴리오가 다변화되어 있으며 가동 자산의 높은 이용률을 바탕으로 안정적인 EBITDA를 창출하고 있으나, 대규모 개발사업 진행에 따른 PF 우발채무 현실화 여부가 주요 모니터링 요인입니다.',
        },
      ],
      auditOpinion: {
        opinion: '적정',
        auditor: '한영회계법인',
        fiscalYear: '2024년 3분기 검토',
        emphasisOfMatter: '분할 신설법인으로서 존속법인과의 연대채무 범위에 관한 주석 7 참조.',
      },
      contingentLiabilities: {
        totalGuarantees: '신재생 사업 SPC 연대보증 1,450억원',
        pledgedAssets: '풍력 발전소 시설물 및 관리운영권',
        litigationRisk: '인허가 관련 행정소송 1건 (소송가액 12억원 미만)',
      },
    },
    deterministicMetrics: {
      interestCoverageRatio: 2.38,
      interestCoverageFormula: '영업이익 (452억원) ÷ 이자비용 (190억원) = 2.38배',
      interestCoverageStatus: 'healthy',

      debtToEquityRatio: 195.4,
      debtToEquityFormula: '총부채 (4,880억원) ÷ 자기자본 (2,497억원) = 195.4%',
      debtToEquityStatus: 'caution',

      netDebtToEbitda: 4.12,
      netDebtToEbitdaFormula: '순차입금 (3,120억원) ÷ EBITDA (757억원) = 4.12배',
      netDebtToEbitdaStatus: 'caution',

      currentRatio: 145.0,
      currentRatioFormula: '유동자산 (2,900억원) ÷ 유동부채 (2,000억원) = 145.0%',
      currentRatioStatus: 'healthy',

      borrowingDependence: 47.8,
      borrowingDependenceFormula: '총차입금 (3,525억원) ÷ 총자산 (7,377억원) = 47.8%',
      borrowingDependenceStatus: 'caution',

      altmanZScore: 1.88,
      altmanZInterpretation: '회색 권역 (이자보상배율 양호하나 레버리지 부담 존재)',

      shortTermDebtRatio: 36.4,
    },
    aiInsights: {
      summary:
        '연 6.85% 표면이율(YTM 7.25%)로 개인투자자 수요가 높은 BBB+ 고수익채권입니다. 발전 자산의 고정전력판매계약(PPA)으로 이자 상환 재원은 충분하나, 사업 SPC의 PF 대출 우발채무 리스크를 지속 관찰해야 합니다.',
      verdict: '이자 수익 추구형 분산 투자 적합',
      riskLevel: 'WATCH',
      keyRisks: [
        {
          title: 'SPC PF 우발채무 전이 가능성',
          description: '사업 지연 시 시공사 및 SPC의 채무인수 부담이 당사로 전이될 수 있습니다.',
          severity: 'warning',
        },
        {
          title: '계통연계 지연 및 출력제어 위험',
          description: '송전선로 용량 한계로 인한 일시적 출력 제한 발생 시 전력판매 매출 감소 우려.',
          severity: 'info',
        },
      ],
      debtServicingCapacity: {
        assessment: '양호 (Good)',
        cashAndEquivalentsNote: '현금성자산 920억원 보유 및 매분기 180억원 수준의 안정적 영업현금 유입.',
        refinancingFeasibility: '공모채 시장 신규 진입 이후 리테일 인지도가 높아 차환 발행 가능.',
      },
      retailInvestorGuidance: [
        '연 7%대 고금리를 누릴 수 있는 매력적인 채권이나 BBB급 특유의 신용스프레드 변동성이 큽니다.',
        '전체 채권 포트폴리오의 10% 이내로 비중을 제한하고, 풍력/태양광 인허가 공시를 주기적으로 확인하세요.',
        '만기보유 전략이 장내 잦은 매매보다 세제 및 거래비용 상 유리합니다.',
      ],
      generatedAt: '2025-02-19T11:20:00Z',
    },
    timelineEvents: [
      {
        id: 'tl-sk1',
        date: '2024-03-04',
        eventType: 'DISCLOSURE',
        title: 'SK디앤디 인적분할 상장',
        summary: '신재생에너지 전문 독립법인 출범.',
        impact: 'neutral',
      },
      {
        id: 'tl-sk2',
        date: '2024-06-20',
        eventType: 'FINANCIAL_REPORT',
        title: '제3회 공모 회사채 800억원 발행',
        summary: '개인투자자 청약 경쟁률 3.2:1 기록.',
        impact: 'positive',
      },
      {
        id: 'tl-sk3',
        date: '2024-11-20',
        eventType: 'FINANCIAL_REPORT',
        title: '3분기 누적 영업이익 452억원 달성',
        summary: '풍력발전 가동률 호조로 컨센서스 상회.',
        impact: 'positive',
      },
    ],
  },
  {
    id: 'eland-world-108',
    name: '이랜드월드 108-1',
    issuer: '이랜드월드',
    ticker: '001250',
    sector: '패션 · 유통',
    rating: 'BBB-',
    ratingAgency: '한국신용평가 · 한국기업평가',
    outlook: '부정적 검토(Watch)',
    issueDate: '2023-09-15',
    maturityDate: '2025-09-15',
    remainingDays: 210,
    couponRate: 7.90,
    ytm: 8.85,
    creditSpreadBps: 540,
    spreadChange30d: 68,
    issueAmount: '500억원',
    parValue: 10000,
    marketPrice: 9810,
    riskLevel: 'CRITICAL',
    riskSignals: [
      {
        id: 'sig-el1',
        type: 'alert',
        title: '신용등급 투기등급(BB+) 강등 직전 경고',
        description: '단기차입금 비중 64% 돌파 및 이자보상배율 1.0배 미달로 신평사 부정적 검토 등재.',
        date: '2024-12-18',
        metricTrigger: '이자보상배율 0.78배 (1.0배 미달 한계기업 구간)',
      },
      {
        id: 'sig-el2',
        type: 'alert',
        title: '단기사채 차환 금리 급등 (연 8.5% 이상)',
        description: '단기자금 시장 경색 시 롤오버 실패 또는 조달비용 폭증 우려.',
        date: '2024-11-30',
      },
      {
        id: 'sig-el3',
        type: 'watch',
        title: '이랜드리테일 등 자회사 지분 매각 유동화 추진 중',
        description: '재무구조 개선을 위한 자산 매각 및 프리IPO 추진 공시.',
        date: '2025-01-10',
      },
    ],
    rawFacts: {
      disclosures: [
        {
          id: 'df-el1',
          date: '2024-12-18',
          title: '[평가원문] 한국기업평가 Rating Watch(하향검토) 등재',
          source: '신평사 평가서',
          originalQuote:
            '총차입금 중 단기차입금 비중이 64.2%에 달해 만기구조가 극도로 취약하며, 국내외 소비 둔화로 영업이익이 급감하여 이자비용을 감당하지 못하는 상태가 지속되고 있어 BBB-(하향검토)에 등록합니다.',
          isKeyTrigger: true,
        },
        {
          id: 'df-el2',
          date: '2024-11-14',
          title: '[감사보고서] 분기보고서 주석 12. 단기차입금 내역',
          source: '감사보고서 주석',
          originalQuote:
            '당사의 단기차입금 및 유동성장기부채 합계액은 1조 6,800억원이며, 이 중 은행 차입금에 대해 자회사 지분 및 유형자산 1조 2,000억원이 담보로 제공되어 있습니다.',
        },
        {
          id: 'df-el3',
          date: '2024-09-25',
          title: '[DART 공시] 담보제공 내역 변경',
          source: 'DART 전자공시',
          originalQuote:
            '이랜드리테일 보통주 2,100,000주를 차입금 담보로 추가 설정하였으며 담보한도액은 3,000억원입니다.',
        },
      ],
      auditOpinion: {
        opinion: '적정',
        auditor: '안진회계법인',
        fiscalYear: '2024년 3분기 검토',
        emphasisOfMatter: '단기차입금 집중으로 인한 유동성 위험 및 자산 매각 진행 경과 강조.',
      },
      contingentLiabilities: {
        totalGuarantees: '계열사 지급보증 4,200억원',
        pledgedAssets: '이랜드리테일 주식 및 신촌 사옥 등 1조 2,000억원',
        litigationRisk: '임대차 보증금 반환 청구 소송 등 140억원',
      },
    },
    deterministicMetrics: {
      interestCoverageRatio: 0.78,
      interestCoverageFormula: '영업이익 (890억원) ÷ 이자비용 (1,141억원) = 0.78배',
      interestCoverageStatus: 'danger',

      debtToEquityRatio: 312.4,
      debtToEquityFormula: '총부채 (3조 4,200억원) ÷ 자기자본 (1조 950억원) = 312.4%',
      debtToEquityStatus: 'danger',

      netDebtToEbitda: 7.45,
      netDebtToEbitdaFormula: '순차입금 (2조 1,600억원) ÷ EBITDA (2,900억원) = 7.45배',
      netDebtToEbitdaStatus: 'danger',

      currentRatio: 88.5,
      currentRatioFormula: '유동자산 (1조 5,200억원) ÷ 유동부채 (1조 7,175억원) = 88.5%',
      currentRatioStatus: 'danger',

      borrowingDependence: 58.2,
      borrowingDependenceFormula: '총차입금 (2조 6,300억원) ÷ 총자산 (4조 5,150억원) = 58.2%',
      borrowingDependenceStatus: 'danger',

      altmanZScore: 1.22,
      altmanZInterpretation: '위험 권역 (부도위험 노출, 재무구조 개선 미흡 시 부도 가능성)',

      shortTermDebtRatio: 64.2,
    },
    aiInsights: {
      summary:
        '연 8% 후반의 고수익률은 매혹적이나, 이자보상배율 0.78배 및 단기차입금 비중 64.2%로 한계기업 임계치에 도달했습니다. 만약 신평사가 투기등급(BB+)으로 1단계 강등할 경우 기관 강제 매도로 급격한 유동성 경색이 올 수 있어 개인투자자의 각별한 주의가 요구됩니다.',
      verdict: '고위험 경고 (신규 매수 자제)',
      riskLevel: 'CRITICAL',
      keyRisks: [
        {
          title: '투기등급(BB+) 강등 위험',
          description: 'BBB-에서 강등 시 채권 담보 인정 비율 급락으로 차환 대출 일제히 중단 가능성.',
          severity: 'danger',
        },
        {
          title: '단기 유동성 갭 (유동비율 88%)',
          description: '1년 내 갚아야 할 단기부채가 유동자산보다 2,000억원 많아 상환 여력 취약.',
          severity: 'danger',
        },
        {
          title: '자회사 알짜 지분 담보 기설정',
          description: '추가 담보 여력이 소진되어 긴급 크레딧라인 확보 난항.',
          severity: 'warning',
        },
      ],
      debtServicingCapacity: {
        assessment: '취약 (Weak)',
        cashAndEquivalentsNote: '가용 현금 2,100억원으로 만기 도래 회사채 500억원은 처리 가능하나, 전체 단기채무 감당엔 역부족.',
        refinancingFeasibility: '자산 매각(이랜드리테일 프리IPO) 지연 시 차환 금리 9% 돌파 예상.',
      },
      retailInvestorGuidance: [
        '단순히 "연 8% 넘는 이자"만 보고 초보 개인투자자가 올인 매수하기에 매우 위험한 채권입니다.',
        '기존 보유자라면 자산 매각 공시가 나와 일시적으로 채권 가격이 반등할 때 비중을 축소할 것을 권고합니다.',
        '단기사채 롤오버 실패 공시 여부를 매주 DART에서 점검하십시오.',
      ],
      generatedAt: '2025-02-21T08:10:00Z',
    },
    timelineEvents: [
      {
        id: 'tl-el1',
        date: '2024-05-15',
        eventType: 'FINANCIAL_REPORT',
        title: '1분기 이자보상배율 0.9배 하락',
        summary: '영업이익 감소로 이자비용 지출 하회.',
        impact: 'negative',
      },
      {
        id: 'tl-el2',
        date: '2024-09-25',
        eventType: 'DISCLOSURE',
        title: '자회사 주식 추가 담보 제공',
        summary: '차입금 연장을 위해 이랜드리테일 주식 담보 신탁.',
        impact: 'neutral',
      },
      {
        id: 'tl-el3',
        date: '2024-12-18',
        eventType: 'RATING_CHANGE',
        title: '한기평, BBB-(하향검토) 등록',
        summary: '투기등급 강등 위기 경고.',
        impact: 'negative',
        metricChange: '스프레드 480bp → 540bp 급등',
      },
    ],
  },
  {
    id: 'korean-air-102',
    name: '대한항공 102',
    issuer: '대한항공',
    ticker: '003490',
    sector: '항공 · 운송',
    rating: 'A-',
    ratingAgency: '한국기업평가 · NICE신용평가',
    outlook: '안정적',
    issueDate: '2023-11-10',
    maturityDate: '2026-11-10',
    remainingDays: 630,
    couponRate: 4.60,
    ytm: 4.65,
    creditSpreadBps: 145,
    spreadChange30d: -8,
    issueAmount: '3,000억원',
    parValue: 10000,
    marketPrice: 9980,
    riskLevel: 'STABLE',
    riskSignals: [
      {
        id: 'sig-ka1',
        type: 'positive',
        title: '아시아나항공 합병 관련 주요국 승인 완료',
        description: 'EU 및 미국 경쟁당국 승인 완료로 메가 캐리어(Mega Carrier) 출범 가시화.',
        date: '2024-11-28',
      },
      {
        id: 'sig-ka2',
        type: 'positive',
        title: '이자보상배율 4.8배로 우수한 이익 창출력 유지',
        description: '국제선 여객 회복 및 프리미엄 클래스 수요 호조로 견고한 영업이익 시현.',
        date: '2024-10-15',
        metricTrigger: '이자보상배율 4.82배',
      },
      {
        id: 'sig-ka3',
        type: 'watch',
        title: '합병 후 아시아나항공 차입금 인수 부담 점검',
        description: '아시아나항공 부채 통합 시 일시적 부채비율 상승 가능성.',
        date: '2024-12-05',
      },
    ],
    rawFacts: {
      disclosures: [
        {
          id: 'df-ka1',
          date: '2024-11-28',
          title: '[DART 공시] 아시아나항공 기업결합 최종 조건 충족',
          source: 'DART 전자공시',
          originalQuote:
            '유럽연합 집행위원회(EC)의 최종 승인 통보를 수령하였으며, 신주인수계약 거래종결을 위한 선행조건이 모두 충족되었습니다.',
          documentNumber: '20241128000492',
        },
        {
          id: 'df-ka2',
          date: '2024-11-14',
          title: '[감사보고서] 분기보고서 주석 16. 금융리스부채',
          source: '감사보고서 주석',
          originalQuote:
            '항공기 리스계약 관련 리스부채 총액은 6조 4,300억원이며, 현금 및 현금성자산(단기금융상품 포함) 3조 8,200억원을 보유하여 리스료 지급에 이상이 없습니다.',
        },
      ],
      auditOpinion: {
        opinion: '적정',
        auditor: '삼일회계법인',
        fiscalYear: '2024년 3분기 검토',
        emphasisOfMatter: '아시아나항공 신주 취득 완료에 따른 연결 재무 영향 주석 31 참조.',
      },
      contingentLiabilities: {
        totalGuarantees: '아시아나항공 유상증자 대금 1조 5,000억원 납입 확약',
        pledgedAssets: '보유 항공기 일부 (담보부사채권 신탁)',
        litigationRisk: '통상적인 노무 및 운송 관련 소송 (경영 영향 미미)',
      },
    },
    deterministicMetrics: {
      interestCoverageRatio: 4.82,
      interestCoverageFormula: '영업이익 (1조 8,900억원) ÷ 이자비용 (3,920억원) = 4.82배',
      interestCoverageStatus: 'healthy',

      debtToEquityRatio: 215.3,
      debtToEquityFormula: '총부채 (20조 1,200억원) ÷ 자기자본 (9조 3,450억원) = 215.3%',
      debtToEquityStatus: 'caution',

      netDebtToEbitda: 2.85,
      netDebtToEbitdaFormula: '순차입금 (8조 2,000억원) ÷ EBITDA (2조 8,770억원) = 2.85배',
      netDebtToEbitdaStatus: 'healthy',

      currentRatio: 122.4,
      currentRatioFormula: '유동자산 (5조 1,200억원) ÷ 유동부채 (4조 1,830억원) = 122.4%',
      currentRatioStatus: 'healthy',

      borrowingDependence: 39.5,
      borrowingDependenceFormula: '총차입금 (11조 6,500억원) ÷ 총자산 (29조 4,650억원) = 39.5%',
      borrowingDependenceStatus: 'caution',

      altmanZScore: 2.76,
      altmanZInterpretation: '회색 권역 상단 (우수한 영업현금흐름, 부도위험 극히 낮음)',

      shortTermDebtRatio: 24.1,
    },
    aiInsights: {
      summary:
        '영업이익률이 업종 내 최상위권이며, 현금성 자산이 3조 8,000억원에 달해 만기 상환 능력이 확고합니다. 아시아나항공 합병 후 부채 통합 이슈가 있으나 독점 노선 시너지로 인한 이익 확대가 상쇄할 것으로 전망됩니다.',
      verdict: '만기보유 안정적 적합',
      riskLevel: 'STABLE',
      keyRisks: [
        {
          title: '아시아나 통합에 따른 일시적 부채비율 상승',
          description: '연결 편입 시 부채비율이 일시적으로 280%선으로 상승할 수 있습니다.',
          severity: 'info',
        },
        {
          title: '국제 유가 및 환율 급등 위험',
          description: '원/달러 환율 1,450원 돌파 시 외화환산손실 발생 가능성.',
          severity: 'warning',
        },
      ],
      debtServicingCapacity: {
        assessment: '우수 (Strong)',
        cashAndEquivalentsNote: '3.8조원 유동성으로 연간 회사채 만기액을 전액 자체 상환 가능한 버퍼 보유.',
        refinancingFeasibility: 'A급 대표 우량채로 기관 및 리테일 수요 풍부.',
      },
      retailInvestorGuidance: [
        '연 4.6%대 이자를 만기까지 변동 없이 안정적으로 수취하기에 가장 균형 잡힌 채권입니다.',
        '개인 채권 계좌의 중핵(Core) 자산으로 20~30% 편입하기 적절합니다.',
      ],
      generatedAt: '2025-02-17T16:40:00Z',
    },
    timelineEvents: [
      {
        id: 'tl-ka1',
        date: '2024-02-13',
        eventType: 'DISCLOSURE',
        title: 'EC 기업결합 조건부 승인 통보',
        summary: '화물사업부 매각 조건부 승인으로 9부 능선 돌파.',
        impact: 'positive',
      },
      {
        id: 'tl-ka2',
        date: '2024-11-14',
        eventType: 'FINANCIAL_REPORT',
        title: '3분기 누적 영업이익 1.8조원 시현',
        summary: '여객 호조세 지속.',
        impact: 'positive',
      },
      {
        id: 'tl-ka3',
        date: '2024-11-28',
        eventType: 'DISCLOSURE',
        title: '기업결합 최종 승인 완료 공시',
        summary: '아시아나 자회사 편입 개시.',
        impact: 'positive',
      },
    ],
  },
  {
    id: 'hyundai-card-845',
    name: '현대카드 845',
    issuer: '현대카드',
    ticker: 'HYUNDAICARD',
    sector: '금융 · 여전채',
    rating: 'AA+',
    ratingAgency: '한국신용평가 · 한국기업평가',
    outlook: '안정적',
    issueDate: '2024-01-18',
    maturityDate: '2027-01-18',
    remainingDays: 700,
    couponRate: 3.85,
    ytm: 3.82,
    creditSpreadBps: 68,
    spreadChange30d: -3,
    issueAmount: '2,000억원',
    parValue: 10000,
    marketPrice: 10020,
    riskLevel: 'LOW',
    riskSignals: [
      {
        id: 'sig-hc1',
        type: 'positive',
        title: '현대차그룹 캡티브 기반 독보적 신용도',
        description: '현대자동차(AA+) 및 기아(AA+)의 캡티브 금융사로서 최상위 신용등급 향유.',
        date: '2024-12-01',
      },
      {
        id: 'sig-hc2',
        type: 'positive',
        title: '카드업계 최저 수준 연체율(0.95%) 방어',
        description: '고객 신용 리스크 관리 강화로 타 카드사 대비 부실채권 비율 안정적 통제.',
        date: '2024-11-15',
        metricTrigger: '연체율 0.95%',
      },
    ],
    rawFacts: {
      disclosures: [
        {
          id: 'df-hc1',
          date: '2024-11-14',
          title: '[DART 공시] 분기보고서 자산건전성 분류 내역',
          source: 'DART 전자공시',
          originalQuote:
            '고정이하자산비율은 0.72%로 전년 동기 대비 0.04%p 개선되었으며, 대손충당금 적립률은 320%로 금융감독원 권고 기준을 대폭 상회하고 있습니다.',
          documentNumber: '20241114000311',
        },
        {
          id: 'df-hc2',
          date: '2024-10-20',
          title: '[평가원문] 한국신용평가 AA+ 평가 요지',
          source: '신평사 평가서',
          originalQuote:
            '현대차그룹의 지분 지배력과 브랜드 공유, 연계 마케팅 효과를 감안할 때 유사시 그룹의 지원 가능성이 최고 수준으로 인정됩니다.',
        },
      ],
      auditOpinion: {
        opinion: '적정',
        auditor: '안진회계법인',
        fiscalYear: '2024년 3분기 검토',
        emphasisOfMatter: '여신전문금융업법상 레버리지 규제비율 준수 확인.',
      },
      contingentLiabilities: {
        totalGuarantees: '없음 (지급보증 미제공 원칙)',
        pledgedAssets: '해외 ABS 발행을 위한 매출채권 신탁 5,000억원',
        litigationRisk: '일반 소비자 분쟁 10건 미만 (영향 미미)',
      },
    },
    deterministicMetrics: {
      interestCoverageRatio: 3.45,
      interestCoverageFormula: '영업이익 (3,850억원) ÷ 이자비용 (1,115억원) = 3.45배',
      interestCoverageStatus: 'healthy',

      debtToEquityRatio: 460.2,
      debtToEquityFormula: '총부채 (14조 2,000억원) ÷ 자기자본 (3조 855억원) = 460.2% (금융사 정상)',
      debtToEquityStatus: 'healthy',

      netDebtToEbitda: 3.1,
      netDebtToEbitdaFormula: '순차입금 (10조원) ÷ EBITDA (3조 2,000억원) = 3.1배',
      netDebtToEbitdaStatus: 'healthy',

      currentRatio: 155.0,
      currentRatioFormula: '유동자산 (8조 2,000억원) ÷ 유동부채 (5조 2,900억원) = 155.0%',
      currentRatioStatus: 'healthy',

      borrowingDependence: 65.0,
      borrowingDependenceFormula: '총차입금 (12조원) ÷ 총자산 (17조 2,855억원) = 65.0% (금융업 특성)',
      borrowingDependenceStatus: 'healthy',

      altmanZScore: 3.85,
      altmanZInterpretation: '초안전 권역 (부도 리스크 전무 수준)',

      shortTermDebtRatio: 22.0,
    },
    aiInsights: {
      summary:
        '국내 최상위 우량 금융채(AA+)로, 현대자동차그룹의 지원 가능성과 업계 최저 수준 연체율이 결합되어 원금 손실 위험이 거의 존재하지 않는 최고 안전등급 채권입니다.',
      verdict: '초우량 만기보유 (예금 대체형)',
      riskLevel: 'LOW',
      keyRisks: [
        {
          title: '시장 금리 인하에 따른 채권 재투자 리스크',
          description: '만기 도래 시점 시중 금리가 낮아질 경우 동일 수준 금리 상품 재투자 난항 가능성.',
          severity: 'info',
        },
      ],
      debtServicingCapacity: {
        assessment: '최우수 (Superior)',
        cashAndEquivalentsNote: '금융권 한도 대출 및 당일 콜론 차입 여력 풍부.',
        refinancingFeasibility: '공모채 발행 시 매번 수배수의 오버부킹 기록.',
      },
      retailInvestorGuidance: [
        '시중은행 1년 정기예금 금리(연 3.0~3.3%) 대비 세후 이자수익이 우월한 예금 대체용 채권입니다.',
        '신용위험에 민감한 보수적 은퇴 생활자 포트폴리오의 50% 이상 비중으로 추천합니다.',
      ],
      generatedAt: '2025-02-15T10:00:00Z',
    },
    timelineEvents: [
      {
        id: 'tl-hc1',
        date: '2024-01-18',
        eventType: 'FINANCIAL_REPORT',
        title: '제845회 여전채 2,000억원 성공적 발행',
        summary: '기관 수요예측 7배수 흥행 달성.',
        impact: 'positive',
      },
      {
        id: 'tl-hc2',
        date: '2024-11-14',
        eventType: 'FINANCIAL_REPORT',
        title: '3분기 연체율 0.95% 공시',
        summary: '업계 최우수 자산건전성 방어 입증.',
        impact: 'positive',
      },
    ],
  },
];
