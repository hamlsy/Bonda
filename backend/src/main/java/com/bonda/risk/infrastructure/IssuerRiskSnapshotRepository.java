package com.bonda.risk.infrastructure;

import com.bonda.risk.domain.IssuerRiskSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface IssuerRiskSnapshotRepository extends JpaRepository<IssuerRiskSnapshot, Long> {

    Optional<IssuerRiskSnapshot> findByIssuerIdAndSnapshotDateAndRuleVersion(
        Long issuerId,
        LocalDate snapshotDate,
        String ruleVersion
    );

    Optional<IssuerRiskSnapshot> findFirstByIssuerIdAndSnapshotDateLessThanOrderBySnapshotDateDescIdDesc(
        Long issuerId,
        LocalDate snapshotDate
    );

    List<IssuerRiskSnapshot> findAllByIssuerIdOrderBySnapshotDateAscIdAsc(Long issuerId);

    Optional<IssuerRiskSnapshot> findFirstByIssuerIdOrderBySnapshotDateDescIdDesc(Long issuerId);
}
