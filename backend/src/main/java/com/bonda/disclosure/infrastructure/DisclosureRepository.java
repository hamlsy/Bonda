package com.bonda.disclosure.infrastructure;

import com.bonda.disclosure.domain.Disclosure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.time.Instant;

public interface DisclosureRepository extends JpaRepository<Disclosure, Long> {

    Optional<Disclosure> findByReceiptNo(String receiptNo);

    List<Disclosure> findAllByIssuerIdOrderByPublishedAtDesc(Long issuerId);

    List<Disclosure> findAllByIssuerIdAndPublishedAtLessThanEqualOrderByPublishedAtAscIdAsc(
        Long issuerId,
        Instant publishedAt
    );
}
