INSERT INTO issuer (corp_code, name, stock_code, created_at, updated_at)
VALUES
    ('DEMO0001', '[데모] 한결산업', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('DEMO0002', '[데모] 바른에너지', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO bond (
    issuer_id,
    isin,
    bond_code,
    name,
    issue_date,
    maturity_date,
    coupon_rate,
    credit_rating,
    created_at
)
VALUES
    ((SELECT id FROM issuer WHERE corp_code = 'DEMO0001'), 'DEMO-ISIN-001', 'DEMO-BOND-001', '[데모] 한결산업 1회 회사채', DATE '2025-01-15', DATE '2028-01-15', 4.2500, 'AA-', CURRENT_TIMESTAMP),
    ((SELECT id FROM issuer WHERE corp_code = 'DEMO0002'), 'DEMO-ISIN-002', 'DEMO-BOND-002', '[데모] 바른에너지 2회 회사채', DATE '2025-06-30', DATE '2030-06-30', 4.8000, 'A+', CURRENT_TIMESTAMP);
