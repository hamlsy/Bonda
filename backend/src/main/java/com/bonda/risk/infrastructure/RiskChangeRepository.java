package com.bonda.risk.infrastructure;

import com.bonda.risk.domain.RiskCategory;
import com.bonda.risk.domain.RiskChange;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.time.Instant;

public interface RiskChangeRepository extends JpaRepository<RiskChange, Long> {

    Optional<RiskChange> findByCurrentSnapshotIdAndCategory(Long currentSnapshotId, RiskCategory category);

    List<RiskChange> findAllByCurrentSnapshotIdOrderByCategoryAsc(Long currentSnapshotId);

    List<RiskChange> findAllByIssuerIdAndDetectedAtGreaterThanEqualOrderByDetectedAtAscIdAsc(
        Long issuerId,
        Instant detectedAt
    );
}
