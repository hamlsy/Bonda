# Bonda AI Evaluation

이 디렉터리는 production Risk Event extraction을 변경하지 않고 Golden Dataset과 baseline을 평가한다.

```text
evaluation/
├── golden/       # human-labeled DART dataset과 schema
├── fixtures/     # evaluator 자체 검증용 synthetic data
├── cache/        # 동일 model/prompt 호출 재사용 파일
├── scripts/      # stdlib-only evaluation runner
├── tests/        # metric, matching, cache unit test
└── reports/      # 생성된 Markdown/JSON 결과
```

## 실행

Quick fixture baseline:

```bash
python evaluation/scripts/evaluate.py --dataset evaluation/fixtures/quick-risk-events.jsonl --methods keyword,regex --report evaluation/reports/quick.md
```

Human-labeled Golden Dataset 전체:

```bash
python evaluation/scripts/evaluate.py --dataset evaluation/golden/risk-events.jsonl --methods keyword,regex,llm,hybrid --backend-url http://localhost:8080 --cache evaluation/cache/llm-results.jsonl --report evaluation/reports/latest.md
```

개발 중에는 `--limit 10`을 사용한다. Report에 `FULL`과 `QUICK`이 구분되어 기록된다. `llm`과 `hybrid`는 cache miss 시 `disclosureVersionId`와 backend URL이 모두 있어야 production analysis endpoint를 호출한다. 조건이 없으면 해당 방법은 `not measured`로 기록하며 빈 prediction으로 점수를 만들지 않는다.

Golden Dataset에는 검토 완료된 실제 DART 문서만 추가한다. API key나 검토된 원문이 없는 상태에서 fixture 또는 AI pseudo-label을 Golden 정답으로 복사하지 않는다.
