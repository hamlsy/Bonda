package com.bonda.disclosure.infrastructure;

import com.bonda.disclosure.domain.DisclosureVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.time.Instant;

public interface DisclosureVersionRepository extends JpaRepository<DisclosureVersion, Long> {

    boolean existsByDisclosureIdAndDocumentHash(Long disclosureId, String documentHash);

    Optional<DisclosureVersion> findFirstBySourceReceiptNoOrderByVersionNumberDesc(String sourceReceiptNo);

    List<DisclosureVersion> findAllByDisclosureIdOrderByVersionNumberAsc(Long disclosureId);

    List<DisclosureVersion> findAllByDisclosureIdAndPublishedAtLessThanEqualOrderByPublishedAtDescVersionNumberDesc(
        Long disclosureId,
        Instant publishedAt
    );
}
