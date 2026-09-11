package com.bonda.disclosure.infrastructure;

import com.bonda.disclosure.domain.Disclosure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DisclosureRepository extends JpaRepository<Disclosure, Long> {

    Optional<Disclosure> findByReceiptNo(String receiptNo);

    List<Disclosure> findAllByIssuerIdOrderByPublishedAtDesc(Long issuerId);
}
