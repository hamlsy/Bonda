package com.bonda.risk.application;

import com.bonda.issuer.infrastructure.IssuerRepository;
import com.bonda.risk.domain.FinancialSnapshot;
import com.bonda.risk.infrastructure.FinancialSnapshotRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class FinancialSnapshotService {

    private final FinancialSnapshotRepository repository;
    private final IssuerRepository issuerRepository;

    public FinancialSnapshotService(FinancialSnapshotRepository repository, IssuerRepository issuerRepository) {
        this.repository = repository;
        this.issuerRepository = issuerRepository;
    }

    @Transactional
    public SaveResult save(Long issuerId, SaveCommand command) {
        if (!issuerRepository.existsById(issuerId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Issuer not found");
        }
        FinancialSnapshot proposed = FinancialSnapshot.create(
            issuerId,
            command.period(),
            command.statementDate(),
            command.cash(),
            command.shortTermDebt(),
            command.longTermDebt(),
            command.operatingCashFlow(),
            command.operatingProfit(),
            command.totalAssets(),
            command.totalLiabilities()
        );
        FinancialSnapshot existing = repository.findByIssuerIdAndPeriodAndStatementScope(
            issuerId,
            proposed.getPeriod(),
            FinancialSnapshot.StatementScope.CONSOLIDATED
        ).orElse(null);
        if (existing != null) {
            if (!existing.hasSameValues(proposed)) {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "FinancialSnapshot already exists for the period with different values"
                );
            }
            return new SaveResult(existing, true);
        }
        return new SaveResult(repository.save(proposed), false);
    }

    public record SaveCommand(
        String period,
        LocalDate statementDate,
        BigDecimal cash,
        BigDecimal shortTermDebt,
        BigDecimal longTermDebt,
        BigDecimal operatingCashFlow,
        BigDecimal operatingProfit,
        BigDecimal totalAssets,
        BigDecimal totalLiabilities
    ) {
    }

    public record SaveResult(FinancialSnapshot snapshot, boolean reused) {
    }
}
