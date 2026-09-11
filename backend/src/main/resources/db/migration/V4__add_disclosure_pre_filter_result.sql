ALTER TABLE disclosure_version
    ADD COLUMN pre_filter_decision VARCHAR(16);

ALTER TABLE disclosure_version
    ADD COLUMN pre_filter_matched_rules TEXT;

ALTER TABLE disclosure_version
    ADD COLUMN pre_filter_matched_keywords TEXT;

ALTER TABLE disclosure_version
    ADD COLUMN pre_filter_target_sections TEXT;

ALTER TABLE disclosure_version
    ADD COLUMN pre_filter_evaluated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE disclosure_version
    ADD COLUMN pre_filter_rule_version VARCHAR(50);

ALTER TABLE disclosure_version
    ADD CONSTRAINT ck_disclosure_version_pre_filter_decision
        CHECK (pre_filter_decision IS NULL OR pre_filter_decision IN ('ANALYZE', 'SKIP'));
