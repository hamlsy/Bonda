ALTER TABLE financial_snapshot ADD COLUMN published_on DATE;

UPDATE financial_snapshot
SET published_on = GREATEST(statement_date, CAST(created_at AS DATE))
WHERE published_on IS NULL;

ALTER TABLE financial_snapshot ALTER COLUMN published_on SET NOT NULL;

ALTER TABLE financial_snapshot ADD CONSTRAINT ck_financial_snapshot_publication
    CHECK (published_on >= statement_date);

CREATE INDEX idx_financial_snapshot_issuer_publication
    ON financial_snapshot (issuer_id, published_on DESC, statement_date DESC);
