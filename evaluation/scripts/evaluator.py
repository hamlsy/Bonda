from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from time import perf_counter
from typing import Callable, Iterable
import hashlib
import json
import re
import urllib.request


EVENT_TYPES = {
    "DEBT_INCREASE", "CASH_DECREASE", "OPERATING_LOSS", "CREDIT_RATING_CHANGE",
    "GUARANTEE_INCREASE", "LIQUIDITY_WARNING",
}


@dataclass(frozen=True)
class Event:
    event_type: str
    event_date: str | None
    amount: float | None
    currency: str | None
    evidence_text: str


@dataclass(frozen=True)
class Document:
    document_id: str
    disclosure_version_id: int | None
    document_hash: str
    issuer: str
    title: str
    published_at: str
    normalized_text: str
    pre_filter_decision: str
    events: tuple[Event, ...]
    dataset_kind: str


@dataclass(frozen=True)
class Prediction:
    document_id: str
    event: Event


@dataclass
class MethodOutput:
    predictions: list[Prediction] = field(default_factory=list)
    measured: bool = True
    unavailable_reason: str | None = None
    latency_ms: float = 0.0
    llm_calls: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    estimated_cost: float = 0.0
    cache_hits: int = 0
    analyzed_documents: int = 0


def load_dataset(path: Path, limit: int | None = None) -> list[Document]:
    documents: list[Document] = []
    seen: set[str] = set()
    for line_number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not raw.strip():
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ValueError(f"{path}:{line_number}: invalid JSON: {exc}") from exc
        document = _load_document(data, path, line_number)
        if document.document_id in seen:
            raise ValueError(f"{path}:{line_number}: duplicate documentId {document.document_id}")
        seen.add(document.document_id)
        documents.append(document)
        if limit is not None and len(documents) >= limit:
            break
    return documents


def _load_document(data: dict, path: Path, line_number: int) -> Document:
    required = {
        "schemaVersion", "datasetKind", "documentId", "documentHash", "issuer", "title",
        "publishedAt", "normalizedText", "preFilterDecision", "eventExists", "events", "annotation",
    }
    missing = required.difference(data)
    if missing:
        raise ValueError(f"{path}:{line_number}: missing fields {sorted(missing)}")
    if data["schemaVersion"] != 1:
        raise ValueError(f"{path}:{line_number}: unsupported schemaVersion")
    if data["datasetKind"] not in {"DART_HUMAN_LABELED", "SYNTHETIC_FIXTURE"}:
        raise ValueError(f"{path}:{line_number}: invalid datasetKind")
    annotation = data["annotation"]
    if annotation.get("reviewStatus") != "REVIEWED":
        raise ValueError(f"{path}:{line_number}: only REVIEWED labels can be evaluated")
    if data["datasetKind"] == "DART_HUMAN_LABELED" and not data.get("sourceUrl"):
        raise ValueError(f"{path}:{line_number}: DART golden samples require sourceUrl")
    if data["datasetKind"] == "DART_HUMAN_LABELED":
        actual_hash = hashlib.sha256(str(data["normalizedText"]).encode("utf-8")).hexdigest()
        if data["documentHash"] != actual_hash:
            raise ValueError(f"{path}:{line_number}: documentHash does not match normalizedText")
    if data["preFilterDecision"] not in {"ANALYZE", "SKIP"}:
        raise ValueError(f"{path}:{line_number}: invalid preFilterDecision")
    if bool(data["events"]) != data["eventExists"]:
        raise ValueError(f"{path}:{line_number}: eventExists does not match events")
    events: list[Event] = []
    for event_data in data["events"]:
        event_type = event_data.get("eventType")
        if event_type not in EVENT_TYPES:
            raise ValueError(f"{path}:{line_number}: invalid eventType {event_type}")
        amount = event_data.get("amount")
        if amount is not None and amount < 0:
            raise ValueError(f"{path}:{line_number}: amount must not be negative")
        evidence = str(event_data.get("evidenceText", "")).strip()
        if not evidence or normalize(evidence) not in normalize(data["normalizedText"]):
            raise ValueError(f"{path}:{line_number}: evidenceText must be a source span")
        events.append(Event(
            event_type, event_data.get("eventDate"),
            float(amount) if amount is not None else None,
            event_data.get("currency"), evidence,
        ))
    return Document(
        str(data["documentId"]), data.get("disclosureVersionId"), str(data["documentHash"]),
        str(data["issuer"]), str(data["title"]), str(data["publishedAt"]),
        str(data["normalizedText"]), str(data["preFilterDecision"]), tuple(events),
        str(data["datasetKind"]),
    )


KEYWORDS = {
    "DEBT_INCREASE": ("단기차입", "차입금"),
    "CASH_DECREASE": ("현금성자산", "가용 유동자금"),
    "OPERATING_LOSS": ("영업손실", "영업적자"),
    "CREDIT_RATING_CHANGE": ("신용등급", "등급전망"),
    "GUARANTEE_INCREASE": ("채무보증", "지급보증"),
    "LIQUIDITY_WARNING": ("유동성 부족", "상환 곤란", "회생절차"),
}


def keyword_baseline(documents: Iterable[Document]) -> MethodOutput:
    output = MethodOutput()
    started = perf_counter()
    for document in documents:
        searchable = f"{document.normalized_text}\n{document.title}"
        for event_type, keywords in KEYWORDS.items():
            matched = next((keyword for keyword in keywords if keyword in searchable), None)
            if matched:
                output.predictions.append(Prediction(
                    document.document_id,
                    Event(event_type, None, None, None, sentence_with(searchable, matched)),
                ))
        output.analyzed_documents += 1
    output.latency_ms = (perf_counter() - started) * 1000
    return output


RULES = {
    "DEBT_INCREASE": re.compile(r"(?:단기)?차입금?.{0,35}(?:증가|확대|신규|조달)"),
    "CASH_DECREASE": re.compile(r"(?:현금(?:성자산)?|가용 유동자금).{0,35}(?:감소|줄었|하락)"),
    "OPERATING_LOSS": re.compile(r"(?:영업손실.{0,20}(?:발생|전환)|영업(?:수지|이익).{0,20}(?:적자 전환|손실 전환))"),
    "CREDIT_RATING_CHANGE": re.compile(r"(?:신용등급|등급전망).{0,35}(?:하향|상향|변경|강등|부정적)"),
    "GUARANTEE_INCREASE": re.compile(r"(?:채무보증|지급보증).{0,40}(?:증가|신규 제공|결정)"),
    "LIQUIDITY_WARNING": re.compile(r"(?:유동성 부족|상환.{0,12}(?:곤란|어려움)|지급불능|회생절차)"),
}
NEGATIONS = ("없었습니다", "없습니다", "발생하지 않았", "동일", "유지")


def regex_baseline(documents: Iterable[Document]) -> MethodOutput:
    output = MethodOutput()
    started = perf_counter()
    for document in documents:
        searchable = f"{document.normalized_text}\n{document.title}"
        for event_type, pattern in RULES.items():
            match = pattern.search(searchable)
            if not match:
                continue
            evidence = sentence_with(searchable, match.group(0))
            if any(term in evidence for term in NEGATIONS):
                continue
            output.predictions.append(Prediction(
                document.document_id,
                Event(event_type, extract_date(evidence), extract_amount(evidence), "KRW", evidence),
            ))
        output.analyzed_documents += 1
    output.latency_ms = (perf_counter() - started) * 1000
    return output


class LlmCacheProvider:
    def __init__(
        self, cache_path: Path, model: str, prompt_version: str,
        backend_url: str | None = None, caller: Callable[[Document], dict] | None = None,
    ) -> None:
        self.cache_path = cache_path
        self.model = model
        self.prompt_version = prompt_version
        self.backend_url = backend_url.rstrip("/") if backend_url else None
        self.caller = caller
        self.cache = self._load_cache()

    def predict(self, document: Document) -> tuple[list[Prediction], dict, bool] | None:
        key = self._key(document)
        cached = self.cache.get(key)
        if (cached and cached.get("status") == "SUCCESS"
                and cached.get("model") == self.model
                and cached.get("promptVersion") == self.prompt_version):
            return self._predictions(document, cached), cached.get("metrics", {}), True
        if document.disclosure_version_id is None or (self.backend_url is None and self.caller is None):
            return None
        payload = self.caller(document) if self.caller else self._call_backend(document)
        entry = self._entry(document, payload)
        if entry["status"] != "SUCCESS":
            return None
        if entry["model"] != self.model or entry["promptVersion"] != self.prompt_version:
            raise ValueError(
                "backend model/promptVersion does not match the requested evaluation configuration"
            )
        self.cache[key] = entry
        self._save_cache()
        return self._predictions(document, entry), entry["metrics"], False

    def _call_backend(self, document: Document) -> dict:
        request = urllib.request.Request(
            f"{self.backend_url}/api/admin/analysis/{document.disclosure_version_id}",
            method="POST", headers={"Accept": "application/json"},
        )
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))

    def _entry(self, document: Document, payload: dict) -> dict:
        return {
            "cacheKey": self._key(document), "documentHash": document.document_hash,
            "model": payload.get("model") or self.model,
            "promptVersion": payload.get("promptVersion") or self.prompt_version,
            "status": payload.get("status"),
            "predictions": [{
                "eventType": item["eventType"], "eventDate": item.get("eventDate"),
                "amount": item.get("amount"), "currency": item.get("currency"),
                "evidenceText": item.get("evidenceText", ""),
            } for item in payload.get("candidates", [])],
            "metrics": {
                "latencyMs": payload.get("latencyMs") or 0,
                "inputTokens": payload.get("inputTokens") or 0,
                "outputTokens": payload.get("outputTokens") or 0,
                "estimatedCost": payload.get("estimatedCost") or 0,
                "backendReused": bool(payload.get("reused")),
            },
        }

    def _predictions(self, document: Document, entry: dict) -> list[Prediction]:
        return [Prediction(document.document_id, Event(
            item["eventType"], item.get("eventDate"),
            float(item["amount"]) if item.get("amount") is not None else None,
            item.get("currency"), item.get("evidenceText", ""),
        )) for item in entry.get("predictions", [])]

    def _key(self, document: Document) -> str:
        raw = f"{document.document_hash}|{self.model}|{self.prompt_version}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def _load_cache(self) -> dict[str, dict]:
        if not self.cache_path.exists():
            return {}
        result = {}
        for raw in self.cache_path.read_text(encoding="utf-8").splitlines():
            if raw.strip():
                entry = json.loads(raw)
                result[entry["cacheKey"]] = entry
        return result

    def _save_cache(self) -> None:
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        text = "\n".join(json.dumps(entry, ensure_ascii=False, sort_keys=True) for entry in self.cache.values())
        self.cache_path.write_text(text + ("\n" if text else ""), encoding="utf-8")


def llm_method(documents: list[Document], provider: LlmCacheProvider, hybrid: bool = False) -> MethodOutput:
    output = MethodOutput()
    started = perf_counter()
    required = [doc for doc in documents if not hybrid or doc.pre_filter_decision == "ANALYZE"]
    for document in required:
        result = provider.predict(document)
        if result is None:
            output.measured = False
            output.unavailable_reason = "cache miss requires disclosureVersionId and a running backend"
            continue
        predictions, metrics, cache_hit = result
        output.predictions.extend(predictions)
        output.cache_hits += int(cache_hit)
        output.llm_calls += 0 if cache_hit or metrics.get("backendReused") else 1
        output.input_tokens += int(metrics.get("inputTokens", 0))
        output.output_tokens += int(metrics.get("outputTokens", 0))
        output.estimated_cost += float(metrics.get("estimatedCost", 0))
        output.latency_ms += float(metrics.get("latencyMs", 0))
        output.analyzed_documents += 1
    if output.latency_ms == 0:
        output.latency_ms = (perf_counter() - started) * 1000
    if output.analyzed_documents != len(required):
        output.measured = False
    return output


def evaluate(documents: list[Document], output: MethodOutput, method: str) -> dict:
    if not documents:
        return {"method": method, "status": "NOT_MEASURED", "reason": "dataset is empty"}
    if not output.measured:
        result = {"method": method, "status": "NOT_MEASURED", "reason": output.unavailable_reason}
        if method == "hybrid":
            positive_docs = sum(bool(document.events) for document in documents)
            analyze_positive_docs = sum(
                bool(document.events) and document.pre_filter_decision == "ANALYZE" for document in documents
            )
            result["preFilterRecall"] = safe_div(analyze_positive_docs, positive_docs)
            result["preFilterSkipRatio"] = safe_div(
                sum(doc.pre_filter_decision == "SKIP" for doc in documents), len(documents)
            )
        return result
    gt_by_doc = {doc.document_id: list(doc.events) for doc in documents}
    pred_by_doc: dict[str, list[Event]] = {doc.document_id: [] for doc in documents}
    for prediction in output.predictions:
        pred_by_doc.setdefault(prediction.document_id, []).append(prediction.event)
    tp = fp = fn = 0
    amount_total = amount_correct = 0
    date_total = date_correct = 0
    evidence_total = evidence_correct = 0
    type_correct = type_denominator = 0
    errors: list[dict] = []
    correct_examples: list[dict] = []

    for document in documents:
        gt_events = gt_by_doc[document.document_id]
        predictions = pred_by_doc.get(document.document_id, [])
        matches, unmatched_gt, unmatched_pred = match_events(gt_events, predictions)
        tp += len(matches)
        fp += len(unmatched_pred)
        fn += len(unmatched_gt)
        type_correct += len(matches)
        type_denominator += max(len(gt_events), len(predictions))
        for gt, prediction in matches:
            if len(correct_examples) < 3:
                correct_examples.append({
                    "documentId": document.document_id,
                    "title": document.title,
                    "eventType": gt.event_type,
                    "evidence": prediction.evidence_text,
                })
            if gt.amount is not None:
                amount_total += 1
                amount_ok = amount_matches(gt.amount, prediction.amount)
                amount_correct += int(amount_ok)
                if not amount_ok:
                    errors.append(extraction_error(document, "AMOUNT_PARSE_FAILURE", gt, prediction, method))
            if gt.event_date is not None:
                date_total += 1
                date_ok = gt.event_date == prediction.event_date
                date_correct += int(date_ok)
                if not date_ok:
                    errors.append(extraction_error(document, "DATE_PARSE_FAILURE", gt, prediction, method))
            evidence_total += 1
            evidence_ok = evidence_matches(gt.evidence_text, prediction.evidence_text)
            evidence_correct += int(evidence_ok)
            if not evidence_ok:
                errors.append(extraction_error(document, "TABLE_PARSE_FAILURE", gt, prediction, method))
        for prediction in unmatched_pred:
            errors.append(error_item(document, "FALSE_POSITIVE", None, prediction, method))
        for gt in unmatched_gt:
            errors.append(error_item(document, "FALSE_NEGATIVE", gt, None, method))

    precision = safe_div(tp, tp + fp)
    recall = safe_div(tp, tp + fn)
    f1 = None if precision is None or recall is None or precision + recall == 0 else 2 * precision * recall / (precision + recall)
    positive_docs = sum(bool(document.events) for document in documents)
    analyze_positive_docs = sum(
        bool(document.events) and document.pre_filter_decision == "ANALYZE" for document in documents
    )
    return {
        "method": method,
        "status": "MEASURED",
        "documents": len(documents),
        "groundTruthEvents": sum(len(document.events) for document in documents),
        "predictions": len(output.predictions),
        "truePositives": tp,
        "falsePositives": fp,
        "falseNegatives": fn,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "eventTypeAccuracy": safe_div(type_correct, type_denominator),
        "amountAccuracy": safe_div(amount_correct, amount_total),
        "eventDateAccuracy": safe_div(date_correct, date_total),
        "evidenceAccuracy": safe_div(evidence_correct, evidence_total),
        "averageLatencyMs": safe_div(output.latency_ms, max(1, output.analyzed_documents)),
        "llmCalls": output.llm_calls,
        "inputTokens": output.input_tokens,
        "outputTokens": output.output_tokens,
        "estimatedCost": output.estimated_cost,
        "averageCost": safe_div(output.estimated_cost, max(1, output.analyzed_documents)),
        "cacheHits": output.cache_hits,
        "llmCallRatio": safe_div(output.llm_calls, len(documents)),
        "preFilterRecall": safe_div(analyze_positive_docs, positive_docs),
        "preFilterSkipRatio": safe_div(sum(doc.pre_filter_decision == "SKIP" for doc in documents), len(documents)),
        "errors": errors,
        "correctExamples": correct_examples,
    }


def match_events(gt_events: list[Event], predictions: list[Event]) -> tuple[list[tuple[Event, Event]], list[Event], list[Event]]:
    unused_predictions = set(range(len(predictions)))
    matches: list[tuple[Event, Event]] = []
    unmatched_gt: list[Event] = []
    for gt in gt_events:
        candidates = [index for index in unused_predictions if predictions[index].event_type == gt.event_type]
        if not candidates:
            unmatched_gt.append(gt)
            continue
        best = max(candidates, key=lambda index: match_score(gt, predictions[index]))
        unused_predictions.remove(best)
        matches.append((gt, predictions[best]))
    return matches, unmatched_gt, [predictions[index] for index in sorted(unused_predictions)]


def match_score(gt: Event, prediction: Event) -> tuple[float, int, int]:
    return (
        token_overlap(gt.evidence_text, prediction.evidence_text),
        int(amount_matches(gt.amount, prediction.amount)) if gt.amount is not None else 0,
        int(gt.event_date == prediction.event_date) if gt.event_date else 0,
    )


def amount_matches(expected: float | None, actual: float | None) -> bool:
    if expected is None:
        return actual is None
    if actual is None:
        return False
    return abs(expected - actual) <= max(1.0, abs(expected) * 0.01)


def evidence_matches(expected: str, actual: str) -> bool:
    left = normalize(expected)
    right = normalize(actual)
    return bool(left and right) and (left in right or right in left or token_overlap(left, right) >= 0.5)


def token_overlap(left: str, right: str) -> float:
    left_tokens = set(re.findall(r"[가-힣A-Za-z0-9]+", normalize(left)))
    right_tokens = set(re.findall(r"[가-힣A-Za-z0-9]+", normalize(right)))
    union = left_tokens | right_tokens
    return len(left_tokens & right_tokens) / len(union) if union else 0.0


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def sentence_with(text: str, fragment: str) -> str:
    for sentence in re.split(r"(?<=[.!?다요])\s+|\n+", text):
        if fragment in sentence:
            return sentence.strip()
    return fragment.strip()


def extract_date(text: str) -> str | None:
    match = re.search(r"(20\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일", text)
    return f"{int(match.group(1)):04d}-{int(match.group(2)):02d}-{int(match.group(3)):02d}" if match else None


def extract_amount(text: str) -> float | None:
    match = re.search(r"(\d[\d,.]*)\s*(조원|억원|백만원|천원|원)", text)
    if not match:
        return None
    value = float(match.group(1).replace(",", ""))
    multiplier = {"원": 1, "천원": 1_000, "백만원": 1_000_000, "억원": 100_000_000, "조원": 1_000_000_000_000}
    return value * multiplier[match.group(2)]


def safe_div(numerator: float, denominator: float) -> float | None:
    return numerator / denominator if denominator else None


def error_item(document: Document, kind: str, expected: Event | None, actual: Event | None, method: str) -> dict:
    if kind == "FALSE_NEGATIVE":
        if method == "hybrid" and document.pre_filter_decision == "SKIP":
            stage = "PRE_FILTER"
        elif method in {"keyword", "regex"}:
            stage = "BASELINE"
        else:
            stage = "PROMPT"
        category = "MISSING_CONTEXT" if stage in {"PRE_FILTER", "BASELINE"} else "EVENT_TYPE_CONFUSION"
    else:
        stage = "BASELINE" if method in {"keyword", "regex"} else "PROMPT"
        category = "KEYWORD_AMBIGUITY" if method == "keyword" else "EVENT_TYPE_CONFUSION"
    return {
        "documentId": document.document_id, "title": document.title, "kind": kind,
        "pipelineStage": stage, "category": category,
        "expected": event_dict(expected), "actual": event_dict(actual),
        "evidence": (expected or actual).evidence_text if (expected or actual) else "",
    }


def extraction_error(document: Document, category: str, expected: Event, actual: Event, method: str) -> dict:
    stage = "BASELINE" if method in {"keyword", "regex"} else "PROMPT"
    return {
        "documentId": document.document_id, "title": document.title, "kind": "EXTRACTION_ERROR",
        "pipelineStage": stage, "category": category,
        "expected": event_dict(expected), "actual": event_dict(actual),
        "evidence": actual.evidence_text,
    }


def event_dict(event: Event | None) -> dict | None:
    if event is None:
        return None
    return {
        "eventType": event.event_type, "eventDate": event.event_date, "amount": event.amount,
        "currency": event.currency, "evidenceText": event.evidence_text,
    }


def write_report(path: Path, dataset_path: Path, mode: str, results: list[dict]) -> None:
    measured = [result for result in results if result["status"] == "MEASURED"]
    documents = measured[0]["documents"] if measured else 0
    events = measured[0]["groundTruthEvents"] if measured else 0
    lines = [
        "# Bonda AI Evaluation", "", "## Dataset", "", f"- Path: `{dataset_path.as_posix()}`",
        f"- Mode: {mode}", f"- Documents: {documents}", f"- Ground Truth Events: {events}",
        "", "## Results", "",
        "| Method | Precision | Recall | F1 | Type Acc. | Amount Acc. | Evidence Acc. | Avg Cost | Avg Latency |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for result in results:
        if result["status"] != "MEASURED":
            lines.append(f"| {result['method']} | not measured | not measured | not measured | not measured | not measured | not measured | not measured | not measured |")
        else:
            lines.append(
                f"| {result['method']} | {metric(result['precision'])} | {metric(result['recall'])} | "
                f"{metric(result['f1'])} | {metric(result['eventTypeAccuracy'])} | "
                f"{metric(result['amountAccuracy'])} | {metric(result['evidenceAccuracy'])} | "
                f"{money(result['averageCost'])} | {number(result['averageLatencyMs'])} ms |"
            )
    lines.extend(["", "## Operational", ""])
    for result in results:
        if result["status"] != "MEASURED":
            pre_filter = ""
            if result.get("preFilterRecall") is not None:
                pre_filter = (
                    f"; pre-filter recall {metric(result['preFilterRecall'])}, "
                    f"skip ratio {metric(result['preFilterSkipRatio'])}"
                )
            lines.append(f"- **{result['method']}**: not measured — {result.get('reason', '')}{pre_filter}")
        else:
            lines.append(
                f"- **{result['method']}**: calls {result['llmCalls']}, cache hits {result['cacheHits']}, "
                f"input/output tokens {result['inputTokens']}/{result['outputTokens']}, "
                f"pre-filter recall {metric(result['preFilterRecall'])}, skip ratio {metric(result['preFilterSkipRatio'])}"
            )
    lines.extend(["", "## Top Errors", ""])
    for result in results:
        if result["status"] != "MEASURED":
            continue
        lines.extend([f"### {result['method']}", ""])
        errors = [error for error in result["errors"] if error["kind"] == "FALSE_POSITIVE"][:3]
        errors += [error for error in result["errors"] if error["kind"] == "FALSE_NEGATIVE"][:3]
        errors += [error for error in result["errors"] if error["kind"] == "EXTRACTION_ERROR"][:3]
        if not errors:
            lines.append("- No unmatched events.")
        for error in errors:
            lines.append(f"- {error['kind']} `{error['documentId']}` — {error['category']} / {error['pipelineStage']}: {error['title']}")
        if result["correctExamples"]:
            example = result["correctExamples"][0]
            lines.append(f"- CORRECT `{example['documentId']}` — {example['eventType']}: {example['title']}")
        lines.append("")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    path.with_suffix(".json").write_text(
        json.dumps({"dataset": str(dataset_path), "mode": mode, "results": results}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def metric(value: float | None) -> str:
    return "n/a" if value is None else f"{value * 100:.1f}%"


def money(value: float | None) -> str:
    return "n/a" if value is None else f"${value:.6f}"


def number(value: float | None) -> str:
    return "n/a" if value is None else f"{value:.2f}"
