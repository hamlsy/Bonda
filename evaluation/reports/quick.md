# Bonda AI Evaluation

## Dataset

- Path: `evaluation/fixtures/quick-risk-events.jsonl`
- Mode: QUICK
- Documents: 11
- Ground Truth Events: 7

## Results

| Method | Precision | Recall | F1 | Type Acc. | Amount Acc. | Evidence Acc. | Avg Cost | Avg Latency |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| keyword | 50.0% | 57.1% | 53.3% | 36.4% | 0.0% | 100.0% | $0.000000 | 0.03 ms |
| regex | 100.0% | 71.4% | 83.3% | 71.4% | 100.0% | 100.0% | $0.000000 | 0.05 ms |
| llm | not measured | not measured | not measured | not measured | not measured | not measured | not measured | not measured |
| hybrid | not measured | not measured | not measured | not measured | not measured | not measured | not measured | not measured |

## Operational

- **keyword**: calls 0, cache hits 0, input/output tokens 0/0, pre-filter recall 42.9%, skip ratio 36.4%
- **regex**: calls 0, cache hits 0, input/output tokens 0/0, pre-filter recall 42.9%, skip ratio 36.4%
- **llm**: not measured — cache miss requires disclosureVersionId and a running backend
- **hybrid**: not measured — cache miss requires disclosureVersionId and a running backend; pre-filter recall 42.9%, skip ratio 36.4%

## Top Errors

### keyword

- FALSE_POSITIVE `fixture-004` — KEYWORD_AMBIGUITY / BASELINE: 정기보고서
- FALSE_POSITIVE `fixture-005` — KEYWORD_AMBIGUITY / BASELINE: 영업실적 안내
- FALSE_POSITIVE `fixture-006` — KEYWORD_AMBIGUITY / BASELINE: 지급보증 현황
- FALSE_NEGATIVE `fixture-008` — MISSING_CONTEXT / BASELINE: 경영 현황
- FALSE_NEGATIVE `fixture-009` — MISSING_CONTEXT / BASELINE: 자금 사정 안내
- FALSE_NEGATIVE `fixture-011` — MISSING_CONTEXT / BASELINE: 자금 운용 현황
- EXTRACTION_ERROR `fixture-001` — AMOUNT_PARSE_FAILURE / BASELINE: 단기차입금 증가결정
- EXTRACTION_ERROR `fixture-001` — DATE_PARSE_FAILURE / BASELINE: 단기차입금 증가결정
- EXTRACTION_ERROR `fixture-002` — AMOUNT_PARSE_FAILURE / BASELINE: 채무보증 결정
- CORRECT `fixture-001` — DEBT_INCREASE: 단기차입금 증가결정

### regex

- FALSE_NEGATIVE `fixture-008` — MISSING_CONTEXT / BASELINE: 경영 현황
- FALSE_NEGATIVE `fixture-009` — MISSING_CONTEXT / BASELINE: 자금 사정 안내
- EXTRACTION_ERROR `fixture-007` — DATE_PARSE_FAILURE / BASELINE: 현금흐름 관련 안내
- EXTRACTION_ERROR `fixture-011` — DATE_PARSE_FAILURE / BASELINE: 자금 운용 현황
- CORRECT `fixture-001` — DEBT_INCREASE: 단기차입금 증가결정
