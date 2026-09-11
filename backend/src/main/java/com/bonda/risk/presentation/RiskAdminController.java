package com.bonda.risk.presentation;

import com.bonda.risk.application.FinancialSnapshotService;
import com.bonda.risk.application.RiskRecalculationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/issuers/{issuerId}")
public class RiskAdminController {

    private final FinancialSnapshotService financialSnapshotService;
    private final RiskRecalculationService recalculationService;

    public RiskAdminController(
        FinancialSnapshotService financialSnapshotService,
        RiskRecalculationService recalculationService
    ) {
        this.financialSnapshotService = financialSnapshotService;
        this.recalculationService = recalculationService;
    }

    @PostMapping("/financial-snapshots")
    public ResponseEntity<FinancialSnapshotResponse> saveFinancialSnapshot(
        @PathVariable Long issuerId,
        @Valid @RequestBody FinancialSnapshotRequest request
    ) {
        FinancialSnapshotService.SaveResult result = financialSnapshotService.save(
            issuerId,
            request.toCommand()
        );
        HttpStatus status = result.reused() ? HttpStatus.OK : HttpStatus.CREATED;
        return ResponseEntity.status(status).body(FinancialSnapshotResponse.from(result));
    }

    @PostMapping("/risk/recalculate")
    public ResponseEntity<RiskRecalculationService.RecalculationResult> recalculate(
        @PathVariable Long issuerId
    ) {
        return ResponseEntity.ok(recalculationService.recalculate(issuerId));
    }

    public record FinancialSnapshotRequest(
        @NotBlank String period,
        @NotNull LocalDate statementDate,
        @NotNull @DecimalMin("0") BigDecimal cash,
        @NotNull @DecimalMin("0") BigDecimal shortTermDebt,
        @NotNull @DecimalMin("0") BigDecimal longTermDebt,
        @NotNull BigDecimal operatingCashFlow,
        @NotNull BigDecimal operatingProfit,
        @DecimalMin("0") BigDecimal totalAssets,
        @DecimalMin("0") BigDecimal totalLiabilities
    ) {
        FinancialSnapshotService.SaveCommand toCommand() {
            return new FinancialSnapshotService.SaveCommand(
                period,
                statementDate,
                cash,
                shortTermDebt,
                longTermDebt,
                operatingCashFlow,
                operatingProfit,
                totalAssets,
                totalLiabilities
            );
        }
    }

    public record FinancialSnapshotResponse(
        Long id,
        Long issuerId,
        String period,
        LocalDate statementDate,
        String statementScope,
        BigDecimal totalDebt,
        boolean reused
    ) {
        static FinancialSnapshotResponse from(FinancialSnapshotService.SaveResult result) {
            var snapshot = result.snapshot();
            return new FinancialSnapshotResponse(
                snapshot.getId(),
                snapshot.getIssuerId(),
                snapshot.getPeriod(),
                snapshot.getStatementDate(),
                snapshot.getStatementScope().name(),
                snapshot.getTotalDebt(),
                result.reused()
            );
        }
    }
}
