package com.bonda.risk.infrastructure;

import com.bonda.risk.domain.FinancialSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FinancialSnapshotRepository extends JpaRepository<FinancialSnapshot, Long> {

    Optional<FinancialSnapshot> findByIssuerIdAndPeriodAndStatementScope(
        Long issuerId,
        String period,
        FinancialSnapshot.StatementScope statementScope
    );

    List<FinancialSnapshot> findAllByIssuerIdOrderByStatementDateDescIdDesc(Long issuerId);
}
