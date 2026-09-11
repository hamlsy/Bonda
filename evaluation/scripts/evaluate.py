from __future__ import annotations

import argparse
import os
from pathlib import Path

from evaluator import LlmCacheProvider, evaluate, keyword_baseline, llm_method, load_dataset, regex_baseline, write_report


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate Bonda Risk Event extraction")
    parser.add_argument("--dataset", type=Path, required=True)
    parser.add_argument("--methods", default="keyword,regex,llm,hybrid")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--backend-url")
    parser.add_argument("--cache", type=Path, default=Path("evaluation/cache/llm-results.jsonl"))
    parser.add_argument("--model", default=os.getenv("BONDA_AI_MODEL", "gpt-5.6-luna"))
    parser.add_argument("--prompt-version", default="RISK_EXTRACTION_V1")
    parser.add_argument("--report", type=Path, default=Path("evaluation/reports/latest.md"))
    args = parser.parse_args()
    if args.limit is not None and args.limit < 1:
        parser.error("--limit must be positive")

    documents = load_dataset(args.dataset, args.limit)
    methods = [item.strip() for item in args.methods.split(",") if item.strip()]
    unknown = set(methods).difference({"keyword", "regex", "llm", "hybrid"})
    if unknown:
        parser.error(f"unknown methods: {sorted(unknown)}")
    provider = LlmCacheProvider(args.cache, args.model, args.prompt_version, backend_url=args.backend_url)
    results = []
    for method in methods:
        if method == "keyword":
            output = keyword_baseline(documents)
        elif method == "regex":
            output = regex_baseline(documents)
        elif method == "llm":
            output = llm_method(documents, provider)
        else:
            output = llm_method(documents, provider, hybrid=True)
        results.append(evaluate(documents, output, method))
    mode = "QUICK" if args.limit is not None or any(doc.dataset_kind == "SYNTHETIC_FIXTURE" for doc in documents) else "FULL"
    write_report(args.report, args.dataset, mode, results)
    print(f"Wrote {args.report} and {args.report.with_suffix('.json')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
