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
import com.bonda.risk.domain.RiskCategory;
import com.bonda.risk.domain.RiskChange;
import com.bonda.risk.domain.RiskState;
import com.bonda.risk.infrastructure.FinancialSnapshotRepository;
import com.bonda.risk.infrastructure.IssuerRiskSnapshotRepository;
import com.bonda.risk.infrastructure.RiskChangeRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SinceBoughtDataAssemblerTest {

    @Test
    void filtersAtPurchaseDateSelectsBaselineAndSortsUnifiedTimeline() {
        HoldingRepository holdings = mock(HoldingRepository.class);
        BondRepository bonds = mock(BondRepository.class);
        IssuerRepository issuers = mock(IssuerRepository.class);
        RiskEventRepository events = mock(RiskEventRepository.class);
        RiskEventEvidenceRepository evidence = mock(RiskEventEvidenceRepository.class);
        RiskChangeRepository changes = mock(RiskChangeRepository.class);
        FinancialSnapshotRepository financials = mock(FinancialSnapshotRepository.class);
        IssuerRiskSnapshotRepository snapshots = mock(IssuerRiskSnapshotRepository.class);
        FinancialChangeCalculator calculator = mock(FinancialChangeCalculator.class);
        SinceBoughtDataAssembler assembler = new SinceBoughtDataAssembler(
            holdings, bonds, issuers, events, evidence, changes, financials, snapshots, calculator
        );
        LocalDate purchaseDate = LocalDate.of(2026, 3, 12);
        Holding holding = mock(Holding.class);
        when(holding.getId()).thenReturn(1L);
        when(holding.getBondId()).thenReturn(2L);
        when(holding.getPurchaseDate()).thenReturn(purchaseDate);
        when(holding.getPurchaseAmount()).thenReturn(new BigDecimal("10000000"));
        Bond bond = mock(Bond.class);
        when(bond.getIssuerId()).thenReturn(3L);
        when(bond.getName()).thenReturn("한결산업 1회 회사채");
        Issuer issuer = mock(Issuer.class);
        when(issuer.getId()).thenReturn(3L);
        when(issuer.getName()).thenReturn("한결산업");
        when(holdings.findById(1L)).thenReturn(Optional.of(holding));
        when(bonds.findById(2L)).thenReturn(Optional.of(bond));
        when(issuers.findById(3L)).thenReturn(Optional.of(issuer));

        RiskEvent before = riskEvent(10L, LocalDate.of(2026, 3, 1));
        RiskEvent after = riskEvent(11L, LocalDate.of(2026, 4, 19));
        when(events.findAllByIssuerIdOrderByEventDateAscIdAsc(3L)).thenReturn(List.of(before, after));
        when(evidence.existsByRiskEventId(11L)).thenReturn(true);
        RiskChange riskChange = mock(RiskChange.class);
        when(riskChange.getId()).thenReturn(20L);
        when(riskChange.getDetectedAt()).thenReturn(Instant.parse("2026-05-21T00:00:00Z"));
        when(riskChange.getCategory()).thenReturn(RiskCategory.LIQUIDITY);
        when(riskChange.getPreviousState()).thenReturn(RiskState.NORMAL);
        when(riskChange.getCurrentState()).thenReturn(RiskState.WATCH);
        when(changes.findAllByIssuerIdAndDetectedAtGreaterThanEqualOrderByDetectedAtAscIdAsc(
            3L,
            Instant.parse("2026-03-11T15:00:00Z")
        )).thenReturn(List.of(riskChange));

        FinancialSnapshot current = financial(31L, LocalDate.of(2026, 5, 3));
        FinancialSnapshot baseline = financial(30L, LocalDate.of(2026, 3, 1));
        when(financials.findAllByIssuerIdOrderByStatementDateDescIdDesc(3L))
            .thenReturn(List.of(current, baseline));
        var financialChange = new FinancialChangeCalculator.FinancialChange(
            "CASH",
            "현금성 자산",
            new BigDecimal("100"),
            new BigDecimal("80"),
            new BigDecimal("-0.2"),
            FinancialChangeCalculator.Direction.DECREASE,
            "현금성 자산이 매수 기준점 대비 20% 감소했습니다."
        );
        when(calculator.calculate(baseline, current)).thenReturn(List.of(financialChange));
        when(snapshots.findFirstByIssuerIdOrderBySnapshotDateDescIdDesc(3L)).thenReturn(Optional.empty());

        SinceBoughtDataAssembler.SinceBoughtData result = assembler.assemble(1L);

        assertThat(result.riskEvents()).containsExactly(after);
        assertThat(result.baselineFinancial()).isSameAs(baseline);
        assertThat(result.currentFinancial()).isSameAs(current);
        assertThat(result.timeline()).extracting(SinceBoughtDataAssembler.TimelineItem::type)
            .containsExactly(
                SinceBoughtDataAssembler.TimelineType.PURCHASE,
                SinceBoughtDataAssembler.TimelineType.RISK_EVENT,
                SinceBoughtDataAssembler.TimelineType.FINANCIAL_CHANGE,
                SinceBoughtDataAssembler.TimelineType.RISK_CHANGE
            );
        assertThat(result.timeline().get(1).evidenceAvailable()).isTrue();
        verify(changes).findAllByIssuerIdAndDetectedAtGreaterThanEqualOrderByDetectedAtAscIdAsc(
            3L,
            Instant.parse("2026-03-11T15:00:00Z")
        );
    }

    private RiskEvent riskEvent(Long id, LocalDate eventDate) {
        RiskEvent event = mock(RiskEvent.class);
        when(event.getId()).thenReturn(id);
        when(event.getEventDate()).thenReturn(eventDate);
        when(event.getEventType()).thenReturn(RiskEventType.DEBT_INCREASE);
        return event;
    }

    private FinancialSnapshot financial(Long id, LocalDate date) {
        FinancialSnapshot snapshot = mock(FinancialSnapshot.class);
        when(snapshot.getId()).thenReturn(id);
        when(snapshot.getStatementDate()).thenReturn(date);
        return snapshot;
    }
}
