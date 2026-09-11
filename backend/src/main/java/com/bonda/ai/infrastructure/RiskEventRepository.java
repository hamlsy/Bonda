package com.bonda.ai.infrastructure;

import com.bonda.ai.domain.RiskEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

public interface RiskEventRepository extends JpaRepository<RiskEvent, Long> {

    Optional<RiskEvent> findByCandidateRiskEventId(Long candidateRiskEventId);

    Optional<RiskEvent> findByEventFingerprint(String eventFingerprint);

    List<RiskEvent> findAllByDisclosureVersionIdOrderByIdAsc(Long disclosureVersionId);

    List<RiskEvent> findAllByIssuerIdOrderByEventDateAscIdAsc(Long issuerId);

    long countByIssuerIdAndEventDateGreaterThanEqual(Long issuerId, LocalDate eventDate);
}
