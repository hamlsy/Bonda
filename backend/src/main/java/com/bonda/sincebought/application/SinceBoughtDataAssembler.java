package com.bonda.sincebought.application;

import com.bonda.ai.domain.RiskEvent;
import com.bonda.ai.domain.RiskEventType;
import com.bonda.ai.infrastructure.RiskEventEvidenceRepository;
import com.bonda.ai.infrastructure.RiskEventRepository;
import com.bonda.bond.domain.Bond;
import com.bonda.bond.infrastructure.BondRepository;
import com.bonda.issuer.domain.Issuer;
import com.bonda.issuer.infrastructure.IssuerRepository;
import com.bonda.portfolio.domain.Holding;
import com.bonda.portfolio.infrastructure.HoldingRepository;
import com.bonda.risk.domain.FinancialSnapshot;
import com.bonda.risk.domain.IssuerRiskSnapshot;
import com.bonda.risk.domain.RiskChange;
import com.bonda.risk.domain.RiskState;
import com.bonda.risk.infrastructure.FinancialSnapshotRepository;
import com.bonda.risk.infrastructure.IssuerRiskSnapshotRepository;
import com.bonda.risk.infrastructure.RiskChangeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class SinceBoughtDataAssembler {

    private static final ZoneId PRODUCT_ZONE = ZoneId.of("Asia/Seoul");

    private final HoldingRepository holdingRepository;
    private final BondRepository bondRepository;
    private final IssuerRepository issuerRepository;
    private final RiskEventRepository riskEventRepository;
    private final RiskEventEvidenceRepository evidenceRepository;
    private final RiskChangeRepository riskChangeRepository;
    private final FinancialSnapshotRepository financialRepository;
    private final IssuerRiskSnapshotRepository riskSnapshotRepository;
    private final FinancialChangeCalculator financialChangeCalculator;

    public SinceBoughtDataAssembler(
        HoldingRepository holdingRepository,
        BondRepository bondRepository,
        IssuerRepository issuerRepository,
        RiskEventRepository riskEventRepository,
        RiskEventEvidenceRepository evidenceRepository,
        RiskChangeRepository riskChangeRepository,
        FinancialSnapshotRepository financialRepository,
        IssuerRiskSnapshotRepository riskSnapshotRepository,
        FinancialChangeCalculator financialChangeCalculator
    ) {
        this.holdingRepository = holdingRepository;
        this.bondRepository = bondRepository;
        this.issuerRepository = issuerRepository;
        this.riskEventRepository = riskEventRepository;
        this.evidenceRepository = evidenceRepository;
        this.riskChangeRepository = riskChangeRepository;
        this.financialRepository = financialRepository;
        this.riskSnapshotRepository = riskSnapshotRepository;
        this.financialChangeCalculator = financialChangeCalculator;
    }

    public SinceBoughtData assemble(Long holdingId) {
        Holding holding = holdingRepository.findById(holdingId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Holding not found"));
        Bond bond = bondRepository.findById(holding.getBondId())
            .orElseThrow(() -> new IllegalStateException("Bond not found for holding"));
        Issuer issuer = issuerRepository.findById(bond.getIssuerId())
            .orElseThrow(() -> new IllegalStateException("Issuer not found for bond"));

        List<RiskEvent> events = riskEventRepository.findAllByIssuerIdOrderByEventDateAscIdAsc(issuer.getId())
            .stream()
            .filter(event -> event.getEventDate() != null)
            .filter(event -> !event.getEventDate().isBefore(holding.getPurchaseDate()))
            .toList();
        Instant purchaseStart = holding.getPurchaseDate().atStartOfDay(PRODUCT_ZONE).toInstant();
        List<RiskChange> riskChanges = riskChangeRepository
            .findAllByIssuerIdAndDetectedAtGreaterThanEqualOrderByDetectedAtAscIdAsc(issuer.getId(), purchaseStart);

        List<FinancialSnapshot> financials = financialRepository
            .findAllByIssuerIdOrderByStatementDateDescIdDesc(issuer.getId());
        FinancialSnapshot currentFinancial = financials.isEmpty() ? null : financials.getFirst();
        FinancialSnapshot baselineFinancial = financials.stream()
            .filter(snapshot -> !snapshot.getStatementDate().isAfter(holding.getPurchaseDate()))
            .findFirst()
            .orElse(null);
        List<FinancialChangeCalculator.FinancialChange> financialChanges = financialChangeCalculator.calculate(
            baselineFinancial,
            currentFinancial
        );
        IssuerRiskSnapshot currentRisk = riskSnapshotRepository
            .findFirstByIssuerIdOrderBySnapshotDateDescIdDesc(issuer.getId())
            .orElse(null);

        List<TimelineItem> timeline = timeline(holding, events, riskChanges, currentFinancial, financialChanges);
        return new SinceBoughtData(
            new HoldingSummary(
                holding.getId(),
                holding.getBondId(),
                bond.getName(),
                issuer.getId(),
                issuer.getName(),
                holding.getPurchaseDate(),
                holding.getPurchaseAmount()
            ),
            events,
            riskChanges,
            baselineFinancial,
            currentFinancial,
            financialChanges,
            currentRisk == null ? null : CurrentRiskState.from(currentRisk),
            timeline
        );
    }

    private List<TimelineItem> timeline(
        Holding holding,
        List<RiskEvent> events,
        List<RiskChange> changes,
        FinancialSnapshot currentFinancial,
        List<FinancialChangeCalculator.FinancialChange> financialChanges
    ) {
        List<TimelineItem> items = new ArrayList<>();
        items.add(new TimelineItem(
            holding.getPurchaseDate(),
            TimelineType.PURCHASE,
            "채권을 매수했어요",
            "이 날짜를 기준으로 이후 변화를 모았습니다.",
            null,
            null,
            null,
            false
        ));
        for (RiskEvent event : events) {
            items.add(new TimelineItem(
                event.getEventDate(),
                TimelineType.RISK_EVENT,
                eventTitle(event.getEventType()),
                eventSummary(event),
                null,
                event.getId(),
                null,
                evidenceRepository.existsByRiskEventId(event.getId())
            ));
        }
        for (RiskChange change : changes) {
            items.add(new TimelineItem(
                change.getDetectedAt().atZone(PRODUCT_ZONE).toLocalDate(),
                TimelineType.RISK_CHANGE,
                categoryName(change) + " 상태가 바뀌었어요",
                stateName(change.getPreviousState()) + " → " + stateName(change.getCurrentState()),
                change.getCurrentState(),
                null,
                change.getId(),
                false
            ));
        }
        if (!financialChanges.isEmpty()) {
            items.add(new TimelineItem(
                currentFinancial.getStatementDate(),
                TimelineType.FINANCIAL_CHANGE,
                "재무 흐름이 달라졌어요",
                financialChanges.stream().map(FinancialChangeCalculator.FinancialChange::summary)
                    .reduce((left, right) -> left + " " + right).orElse(""),
                null,
                null,
                null,
                false
            ));
        }
        return items.stream().sorted(
            Comparator.comparing(TimelineItem::date)
                .thenComparingInt(item -> item.type() == TimelineType.PURCHASE ? 0 : 1)
                .thenComparing(item -> item.type().ordinal())
        ).toList();
    }

    private String eventTitle(RiskEventType type) {
        return switch (type) {
            case DEBT_INCREASE -> "차입금이 증가했어요";
            case CASH_DECREASE -> "현금성 자산이 감소했어요";
            case OPERATING_LOSS -> "영업손실이 확인됐어요";
            case CREDIT_RATING_CHANGE -> "신용등급 정보가 바뀌었어요";
            case GUARANTEE_INCREASE -> "보증 부담이 증가했어요";
            case LIQUIDITY_WARNING -> "유동성 관련 경고가 확인됐어요";
        };
    }

    private String eventSummary(RiskEvent event) {
        if (event.getAmount() == null) {
            return "검증된 공시 원문에서 확인된 변화입니다.";
        }
        if ("KRW".equals(event.getCurrency())) {
            BigDecimal hundredMillionWon = new BigDecimal("100000000");
            BigDecimal[] divided = event.getAmount().divideAndRemainder(hundredMillionWon);
            if (divided[1].signum() == 0) {
                return divided[0].stripTrailingZeros().toPlainString() + "억원";
            }
            return event.getAmount().stripTrailingZeros().toPlainString() + "원";
        }
        return event.getAmount().stripTrailingZeros().toPlainString()
            + (event.getCurrency() == null ? "" : " " + event.getCurrency());
    }

    private String categoryName(RiskChange change) {
        return switch (change.getCategory()) {
            case LIQUIDITY -> "유동성";
            case CASH_FLOW -> "현금흐름";
            case LEVERAGE -> "부채 부담";
            case EARNINGS -> "수익성";
            case CREDIT -> "신용";
        };
    }

    private String stateName(RiskState state) {
        return switch (state) {
            case NORMAL -> "정상";
            case WATCH -> "관찰";
            case CAUTION -> "주의";
        };
    }

    public enum TimelineType {
        PURCHASE,
        RISK_EVENT,
        RISK_CHANGE,
        FINANCIAL_CHANGE
    }

    public record TimelineItem(
        LocalDate date,
        TimelineType type,
        String title,
        String summary,
        RiskState severity,
        Long riskEventId,
        Long riskChangeId,
        boolean evidenceAvailable
    ) {
    }

    public record HoldingSummary(
        Long id,
        Long bondId,
        String bondName,
        Long issuerId,
        String issuerName,
        LocalDate purchaseDate,
        BigDecimal purchaseAmount
    ) {
    }

    public record CurrentRiskState(
        Long snapshotId,
        LocalDate snapshotDate,
        RiskState liquidity,
        RiskState cashFlow,
        RiskState leverage,
        RiskState earnings,
        RiskState credit,
        String ruleVersion
    ) {
        static CurrentRiskState from(IssuerRiskSnapshot snapshot) {
            return new CurrentRiskState(
                snapshot.getId(),
                snapshot.getSnapshotDate(),
                snapshot.getLiquidityState(),
                snapshot.getCashFlowState(),
                snapshot.getLeverageState(),
                snapshot.getEarningsState(),
                snapshot.getCreditState(),
                snapshot.getRuleVersion()
            );
        }
    }

    public record SinceBoughtData(
        HoldingSummary holding,
        List<RiskEvent> riskEvents,
        List<RiskChange> riskChanges,
        FinancialSnapshot baselineFinancial,
        FinancialSnapshot currentFinancial,
        List<FinancialChangeCalculator.FinancialChange> financialChanges,
        CurrentRiskState currentRiskState,
        List<TimelineItem> timeline
    ) {
        public SinceBoughtData {
            riskEvents = List.copyOf(riskEvents);
            riskChanges = List.copyOf(riskChanges);
            financialChanges = List.copyOf(financialChanges);
            timeline = List.copyOf(timeline);
        }
    }
}
