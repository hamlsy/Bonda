package com.bonda.alert.application;

import com.bonda.alert.domain.Alert;
import com.bonda.alert.infrastructure.AlertRepository;
import com.bonda.ai.infrastructure.RiskEventRepository;
import com.bonda.bond.domain.Bond;
import com.bonda.bond.infrastructure.BondRepository;
import com.bonda.issuer.domain.Issuer;
import com.bonda.issuer.infrastructure.IssuerRepository;
import com.bonda.portfolio.domain.Holding;
import com.bonda.portfolio.infrastructure.HoldingRepository;
import com.bonda.risk.domain.IssuerRiskSnapshot;
import com.bonda.risk.domain.RiskChange;
import com.bonda.risk.domain.RiskState;
import com.bonda.risk.infrastructure.IssuerRiskSnapshotRepository;
import com.bonda.risk.infrastructure.RiskChangeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;

@Service
public class MyBondsSummaryService {

    private static final ZoneId PRODUCT_ZONE = ZoneId.of("Asia/Seoul");

    private final HoldingRepository holdingRepository;
    private final BondRepository bondRepository;
    private final IssuerRepository issuerRepository;
    private final RiskEventRepository riskEventRepository;
    private final RiskChangeRepository riskChangeRepository;
    private final IssuerRiskSnapshotRepository riskSnapshotRepository;
    private final AlertRepository alertRepository;
    private final AlertService alertService;

    public MyBondsSummaryService(
        HoldingRepository holdingRepository,
        BondRepository bondRepository,
        IssuerRepository issuerRepository,
        RiskEventRepository riskEventRepository,
        RiskChangeRepository riskChangeRepository,
        IssuerRiskSnapshotRepository riskSnapshotRepository,
        AlertRepository alertRepository,
        AlertService alertService
    ) {
        this.holdingRepository = holdingRepository;
        this.bondRepository = bondRepository;
        this.issuerRepository = issuerRepository;
        this.riskEventRepository = riskEventRepository;
        this.riskChangeRepository = riskChangeRepository;
        this.riskSnapshotRepository = riskSnapshotRepository;
        this.alertRepository = alertRepository;
        this.alertService = alertService;
    }

    @Transactional(readOnly = true)
    public List<MyBondSummary> findAll() {
        return holdingRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(this::summary)
            .sorted(Comparator
                .comparingLong(MyBondSummary::unreadAlertCount).reversed()
                .thenComparing(MyBondSummary::latestActivityAt, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(MyBondSummary::purchaseDate, Comparator.reverseOrder()))
            .toList();
    }

    private MyBondSummary summary(Holding holding) {
        Bond bond = bondRepository.findById(holding.getBondId())
            .orElseThrow(() -> new IllegalStateException("Bond not found for holding"));
        Issuer issuer = issuerRepository.findById(bond.getIssuerId())
            .orElseThrow(() -> new IllegalStateException("Issuer not found for bond"));
        Instant purchaseStart = holding.getPurchaseDate().atStartOfDay(PRODUCT_ZONE).toInstant();
        RiskChange latestChange = riskChangeRepository
            .findFirstByIssuerIdAndDetectedAtGreaterThanEqualOrderByDetectedAtDescIdDesc(
                issuer.getId(), purchaseStart
            ).orElse(null);
        IssuerRiskSnapshot riskSnapshot = riskSnapshotRepository
            .findFirstByIssuerIdOrderBySnapshotDateDescIdDesc(issuer.getId()).orElse(null);
        Alert latestAlert = alertRepository.findFirstByHoldingIdOrderByCreatedAtDescIdDesc(holding.getId())
            .orElse(null);
        return new MyBondSummary(
            holding.getId(), bond.getId(), bond.getName(), issuer.getName(), holding.getPurchaseDate(),
            holding.getPurchaseAmount(), riskState(riskSnapshot), LatestRiskChange.from(latestChange),
            riskEventRepository.countByIssuerIdAndEventDateGreaterThanEqual(
                issuer.getId(), holding.getPurchaseDate()
            ),
            alertRepository.countByHoldingIdAndReadFalse(holding.getId()),
            latestAlert == null ? null : alertService.view(latestAlert, bond),
            latestAlert != null ? latestAlert.getCreatedAt()
                : latestChange == null ? null : latestChange.getDetectedAt()
        );
    }

    private RiskStateSummary riskState(IssuerRiskSnapshot snapshot) {
        if (snapshot == null) return null;
        RiskState overall = RiskState.NORMAL;
        overall = RiskState.max(overall, snapshot.getLiquidityState());
        overall = RiskState.max(overall, snapshot.getCashFlowState());
        overall = RiskState.max(overall, snapshot.getLeverageState());
        overall = RiskState.max(overall, snapshot.getEarningsState());
        overall = RiskState.max(overall, snapshot.getCreditState());
        return new RiskStateSummary(
            overall, snapshot.getSnapshotDate(), snapshot.getLiquidityState(), snapshot.getCashFlowState(),
            snapshot.getLeverageState(), snapshot.getEarningsState(), snapshot.getCreditState()
        );
    }

    public record RiskStateSummary(
        RiskState overall,
        LocalDate snapshotDate,
        RiskState liquidity,
        RiskState cashFlow,
        RiskState leverage,
        RiskState earnings,
        RiskState credit
    ) {
    }

    public record LatestRiskChange(
        Long id,
        String category,
        RiskState previousState,
        RiskState currentState,
        Instant detectedAt
    ) {
        static LatestRiskChange from(RiskChange change) {
            return change == null ? null : new LatestRiskChange(
                change.getId(), change.getCategory().name(), change.getPreviousState(),
                change.getCurrentState(), change.getDetectedAt()
            );
        }
    }

    public record MyBondSummary(
        Long holdingId,
        Long bondId,
        String bondName,
        String issuerName,
        LocalDate purchaseDate,
        BigDecimal purchaseAmount,
        RiskStateSummary currentRiskState,
        LatestRiskChange latestRiskChange,
        long newEventCount,
        long unreadAlertCount,
        AlertService.AlertView latestAlert,
        Instant latestActivityAt
    ) {
    }
}

