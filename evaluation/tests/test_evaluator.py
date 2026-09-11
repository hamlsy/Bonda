from pathlib import Path
from tempfile import TemporaryDirectory
import json
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from evaluator import (  # noqa: E402
    Document,
    Event,
    LlmCacheProvider,
    MethodOutput,
    Prediction,
    amount_matches,
    evaluate,
    evidence_matches,
    load_dataset,
    match_events,
)


class EvaluatorTest(unittest.TestCase):
    def test_matching_is_one_to_one_and_duplicate_prediction_is_false_positive(self):
        gt = [Event("DEBT_INCREASE", "2026-01-01", 100.0, "KRW", "차입금 100원 증가")]
        predictions = [
            Event("DEBT_INCREASE", "2026-01-01", 100.0, "KRW", "차입금 100원 증가"),
            Event("DEBT_INCREASE", "2026-01-01", 100.0, "KRW", "차입금 100원 증가"),
        ]

        matches, missing, extra = match_events(gt, predictions)

        self.assertEqual(1, len(matches))
        self.assertEqual([], missing)
        self.assertEqual(1, len(extra))

    def test_metric_edges_amount_and_evidence_are_deterministic(self):
        document = self.document(events=())
        result = evaluate([document], MethodOutput(analyzed_documents=1), "keyword")

        self.assertIsNone(result["precision"])
        self.assertIsNone(result["recall"])
        self.assertTrue(amount_matches(100.0, 101.0))
        self.assertFalse(amount_matches(100.0, None))
        self.assertTrue(evidence_matches("단기차입금 100억원 증가", "회사는 단기차입금 100억원 증가를 결정했다"))

    def test_metrics_include_duplicate_false_positive_and_missing_event(self):
        expected = Event("DEBT_INCREASE", "2026-01-01", 100.0, "KRW", "차입금 100원 증가")
        document = self.document(events=(expected, Event("CASH_DECREASE", None, None, None, "현금 감소")))
        output = MethodOutput(
            predictions=[
                Prediction(document.document_id, expected),
                Prediction(document.document_id, expected),
            ],
            analyzed_documents=1,
        )

        result = evaluate([document], output, "regex")

        self.assertEqual(1, result["truePositives"])
        self.assertEqual(1, result["falsePositives"])
        self.assertEqual(1, result["falseNegatives"])
        self.assertAlmostEqual(0.5, result["precision"])
        self.assertAlmostEqual(0.5, result["recall"])

    def test_loader_rejects_event_exists_mismatch(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "invalid.jsonl"
            data = {
                "schemaVersion": 1,
                "datasetKind": "SYNTHETIC_FIXTURE",
                "documentId": "bad",
                "documentHash": "bad",
                "issuer": "issuer",
                "title": "title",
                "publishedAt": "2026-01-01T00:00:00Z",
                "normalizedText": "content",
                "preFilterDecision": "SKIP",
                "eventExists": True,
                "events": [],
                "annotation": {"annotator": "test", "reviewStatus": "REVIEWED", "notes": ""},
            }
            path.write_text(json.dumps(data), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "eventExists"):
                load_dataset(path)

    def test_successful_llm_result_is_cached_and_reused(self):
        calls = 0

        def caller(_document):
            nonlocal calls
            calls += 1
            return {
                "status": "SUCCESS",
                "model": "test-model",
                "promptVersion": "RISK_EXTRACTION_V1",
                "reused": False,
                "inputTokens": 10,
                "outputTokens": 5,
                "latencyMs": 20,
                "estimatedCost": 0.001,
                "candidates": [{
                    "eventType": "DEBT_INCREASE",
                    "eventDate": "2026-01-01",
                    "amount": 100,
                    "currency": "KRW",
                    "evidenceText": "차입금 100원 증가",
                }],
            }

        with TemporaryDirectory() as directory:
            cache = Path(directory) / "cache.jsonl"
            document = self.document(disclosure_version_id=1)
            provider = LlmCacheProvider(cache, "test-model", "RISK_EXTRACTION_V1", caller=caller)

            first = provider.predict(document)
            second = provider.predict(document)

            self.assertIsNotNone(first)
            self.assertIsNotNone(second)
            self.assertFalse(first[2])
            self.assertTrue(second[2])
            self.assertEqual(1, calls)

    def document(self, events=(), disclosure_version_id=None):
        return Document(
            "doc-1", disclosure_version_id, "hash-1", "issuer", "title",
            "2026-01-01T00:00:00Z", "차입금 100원 증가 현금 감소", "ANALYZE",
            tuple(events), "SYNTHETIC_FIXTURE",
        )


if __name__ == "__main__":
    unittest.main()
