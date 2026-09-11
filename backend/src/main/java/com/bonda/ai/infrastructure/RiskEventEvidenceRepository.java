package com.bonda.ai.infrastructure;

import com.bonda.ai.domain.RiskEventEvidence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RiskEventEvidenceRepository extends JpaRepository<RiskEventEvidence, Long> {

    List<RiskEventEvidence> findAllByRiskEventIdOrderByIdAsc(Long riskEventId);

    boolean existsByRiskEventId(Long riskEventId);
}
