package com.bonda.sincebought.application;

import com.bonda.ai.domain.RiskEvent;
import com.bonda.ai.infrastructure.RiskEventEvidenceRepository;
import com.bonda.ai.infrastructure.RiskEventRepository;
import com.bonda.disclosure.domain.Disclosure;
import com.bonda.disclosure.domain.DisclosureVersion;
import com.bonda.disclosure.infrastructure.DisclosureRepository;
import com.bonda.disclosure.infrastructure.DisclosureVersionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class RiskEventDetailService {

    private final RiskEventRepository riskEventRepository;
    private final RiskEventEvidenceRepository evidenceRepository;
    private final DisclosureVersionRepository versionRepository;
    private final DisclosureRepository disclosureRepository;

    public RiskEventDetailService(
        RiskEventRepository riskEventRepository,
        RiskEventEvidenceRepository evidenceRepository,
        DisclosureVersionRepository versionRepository,
        DisclosureRepository disclosureRepository
    ) {
        this.riskEventRepository = riskEventRepository;
        this.evidenceRepository = evidenceRepository;
        this.versionRepository = versionRepository;
        this.disclosureRepository = disclosureRepository;
    }

    @Transactional(readOnly = true)
    public RiskEventDetail find(Long riskEventId) {
        RiskEvent event = riskEventRepository.findById(riskEventId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "RiskEvent not found"));
        DisclosureVersion version = versionRepository.findById(event.getDisclosureVersionId())
            .orElseThrow(() -> new IllegalStateException("DisclosureVersion not found for RiskEvent"));
        Disclosure disclosure = disclosureRepository.findById(version.getDisclosureId())
            .orElseThrow(() -> new IllegalStateException("Disclosure not found for RiskEvent"));
        List<EvidenceView> evidence = evidenceRepository.findAllByRiskEventIdOrderByIdAsc(event.getId())
            .stream()
            .map(item -> new EvidenceView(
                item.getId(),
                item.getSection(),
                item.getEvidenceText(),
                item.getSourceUrl()
            )).toList();
        return new RiskEventDetail(
            event.getId(),
            event.getEventType().name(),
            event.getEventDate(),
            event.getAmount(),
            event.getCurrency(),
            disclosure.getTitle(),
            disclosure.getPublishedAt(),
            version.getSourceReceiptNo(),
            evidence
        );
    }

    public record EvidenceView(Long id, String section, String evidenceText, String sourceUrl) {
    }

    public record RiskEventDetail(
        Long id,
        String eventType,
        java.time.LocalDate eventDate,
        java.math.BigDecimal amount,
        String currency,
        String disclosureTitle,
        Instant publishedAt,
        String sourceReceiptNo,
        List<EvidenceView> evidence
    ) {
        public RiskEventDetail {
            evidence = List.copyOf(evidence);
        }
    }
}
