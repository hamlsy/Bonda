import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client with required User-Agent
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// API: Live AI Credit Risk Analysis
app.post('/api/gemini/analyze-bond', async (req, res) => {
  try {
    const {
      bondName,
      issuer,
      rating,
      outlook,
      metrics,
      rawFacts,
      customQuery,
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Return structured fallback response if no key yet
      return res.json({
        success: true,
        source: 'fallback',
        analysis: {
          summary: `${issuer} (${bondName})의 신용위험은 현재 신용등급 [${rating} / ${outlook}] 상태에서 정량 지표상 이자보상배율(${metrics?.interestCoverage || 'N/A'}배) 및 부채비율(${metrics?.debtToEquity || 'N/A'}%)의 변화 추이를 면밀히 주시해야 합니다.`,
          verdict: outlook === '부정적' || (metrics?.interestCoverage && metrics.interestCoverage < 1.0) ? '주의 관망' : '조건부 만기보유 적합',
          riskLevel: outlook === '부정적' || (metrics?.interestCoverage && metrics.interestCoverage < 1.0) ? 'HIGH' : 'MEDIUM',
          keyRisks: [
            {
              title: '단기 차입금 차환 부담',
              description: '향후 1년 내 만기 도래하는 회사채 및 단기사채의 만기집중도로 인한 유동성 리파이낸싱 리스크를 점검해야 합니다.',
              severity: 'warning',
            },
            {
              title: '영업현금흐름 변동성',
              description: '주요 전방산업 시황 및 원자재 가격 변동에 따른 영업이익률 축소 가능성에 유의가 필요합니다.',
              severity: 'info',
            },
            {
              title: '계열 지원 및 우발채무',
              description: '감사보고서 주석에 기재된 담보제공 및 지급보증 한도 실행 여부를 정기적으로 모니터링해야 합니다.',
              severity: 'info',
            },
          ],
          debtServicingCapacity: {
            assessment: '보통 (Adequate)',
            cashAndEquivalentsNote: '보유 현금성 자산 및 미사용 여신한도를 통해 단기 채무는 방어 가능하나, 추가적인 유동성 확보 계획이 필요합니다.',
            refinancingFeasibility: '공모채 차환 또는 은행권 담보차입을 통한 롤오버 가능성 유효',
          },
          retailInvestorGuidance: [
            '중도 매매 차익보다는 확정 이자 수취 목적의 분산 투자를 권장합니다.',
            '신용평가사의 수시평가(Rating Watch) 공시 발생 시 즉시 신용스프레드 확대를 확인하세요.',
            '동일 기업 채권 비중은 개인 채권 포트폴리오의 15% 이내로 제한하는 것이 안전합니다.',
          ],
          generatedAt: new Date().toISOString(),
        },
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      throw new Error('Gemini client could not be initialized');
    }

    const prompt = `
당신은 대한민국 회사채 전문 수석 크레딧 애널리스트(Senior Credit Analyst)입니다.
개인투자자(Retail Investor)를 위해 아래의 [원문 사실(Raw Facts)]과 [정량 계산 지표(Deterministic Metrics)]를 엄밀하게 대조·분석하여 신용 리스크 리포트를 작성하세요.

## 분석 대상 채권:
- 종목명: ${bondName}
- 발행사: ${issuer}
- 신용등급 및 전망: ${rating} (${outlook})

## 정량 계산 지표(Deterministic Metrics):
${JSON.stringify(metrics, null, 2)}

## 원문 사실(Raw Facts - 공시 및 감사보고서 발췌):
${JSON.stringify(rawFacts, null, 2)}

${customQuery ? `## 개인투자자 특별 질의사항:\n${customQuery}` : ''}

반드시 다음 JSON 스키마를 엄격히 준수하여 한국어로 응답하십시오.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: '당신은 개인투자자를 위한 객관적이고 날카로운 AI 크레딧 채권 분석가입니다. 뜬구름 잡는 일반론을 피하고, 제공된 공시 사실과 재무 지표 수치를 직접 인용하여 구체적이고 실전적인 채권 위험도 분석을 제공하세요.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: '개인투자자가 한눈에 파악할 수 있는 신용위험 총평 (2-3문장)',
            },
            verdict: {
              type: Type.STRING,
              description: '최종 종합 판정 (예: 만기보유 적합 / 주의 관망 / 비중 축소 권고 / 고위험 경고)',
            },
            riskLevel: {
              type: Type.STRING,
              description: '위험 수준: LOW, MEDIUM, HIGH, CRITICAL 중 하나',
            },
            keyRisks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  severity: { type: Type.STRING, description: 'warning, danger, or info' },
                },
                required: ['title', 'description', 'severity'],
              },
            },
            debtServicingCapacity: {
              type: Type.OBJECT,
              properties: {
                assessment: { type: Type.STRING, description: '상환능력 평가 (우수, 양호, 보통, 취약)' },
                cashAndEquivalentsNote: { type: Type.STRING, description: '현금보유 및 영업현금흐름 기반 상환여력 진단' },
                refinancingFeasibility: { type: Type.STRING, description: '회사채 만기도래 시 리파이낸싱(차환) 성공 가능성' },
              },
              required: ['assessment', 'cashAndEquivalentsNote', 'refinancingFeasibility'],
            },
            retailInvestorGuidance: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '개인투자자 맞춤 실전 행동 요령 3가지',
            },
          },
          required: ['summary', 'verdict', 'riskLevel', 'keyRisks', 'debtServicingCapacity', 'retailInvestorGuidance'],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Empty response received from Gemini');
    }

    const parsed = JSON.parse(textOutput);
    return res.json({
      success: true,
      source: 'gemini-live',
      analysis: {
        ...parsed,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in analyze-bond API:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'AI 분석 처리 중 오류가 발생했습니다.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BondCredit AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
