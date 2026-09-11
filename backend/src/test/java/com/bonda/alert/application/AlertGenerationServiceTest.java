package com.bonda.alert.application;

import com.bonda.ai.domain.RiskEvent;
import com.bonda.ai.domain.RiskEventType;
import com.bonda.alert.domain.Alert;
import com.bonda.alert.domain.AlertPolicy;
import com.bonda.alert.infrastructure.AlertRepository;
import com.bonda.bond.domain.Bond;
import com.bonda.bond.infrastructure.BondRepository;
import com.bonda.issuer.domain.Issuer;
import com.bonda.issuer.infrastructure.IssuerRepository;
import com.bonda.portfolio.domain.Holding;
import com.bonda.portfolio.infrastructure.HoldingRepository;
import com.bonda.portfolio.infrastructure.WatchlistRepository;
import com.bonda.risk.infrastructure.IssuerRiskSnapshotRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AlertGenerationServiceTest {

    @Test
    void noVerifiedChangeCreatesNoAlert() {
        AlertRepository alerts = mock(AlertRepository.class);
        AlertGenerationService service = service(alerts, mock(BondRepository.class), mock(HoldingRepository.class));

        var result = service.generate(null, List.of());

        assertThat(result.created()).isZero();
        verify(alerts, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void anExistingFingerprintIsReusedInsteadOfDuplicated() {
        AlertRepository alerts = mock(AlertRepository.class);
        BondRepository bonds = mock(BondRepository.class);
        HoldingRepository holdings = mock(HoldingRepository.class);
        RiskEvent event = mock(RiskEvent.class);
        when(event.getId()).thenReturn(7L);
        when(event.getIssuerId()).thenReturn(3L);
        when(event.getEventType()).thenReturn(RiskEventType.LIQUIDITY_WARNING);
        when(event.getEventDate()).thenReturn(LocalDate.of(2026, 2, 1));
        Bond bond = mock(Bond.class);
        when(bond.getId()).thenReturn(2L);
        Holding holding = mock(Holding.class);
        when(holding.getId()).thenReturn(1L);
        when(holding.getPurchaseDate()).thenReturn(LocalDate.of(2026, 1, 10));
        when(bonds.findAllByIssuerIdOrderByIdAsc(3L)).thenReturn(List.of(bond));
        when(holdings.findAllByBondIdOrderByIdAsc(2L)).thenReturn(List.of(holding));
        when(alerts.findByFingerprint(anyString())).thenReturn(Optional.of(mock(Alert.class)));

        var result = service(alerts, bonds, holdings).generate(event, List.of());

        assertThat(result.created()).isZero();
        assertThat(result.reused()).isEqualTo(1);
        verify(alerts, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void aSelectedEventWithoutRiskChangeCreatesAnEventAlert() {
        AlertRepository alerts = mock(AlertRepository.class);
        BondRepository bonds = mock(BondRepository.class);
        HoldingRepository holdings = mock(HoldingRepository.class);
        RiskEvent event = mock(RiskEvent.class);
        when(event.getId()).thenReturn(8L);
        when(event.getIssuerId()).thenReturn(3L);
        when(event.getEventType()).thenReturn(RiskEventType.LIQUIDITY_WARNING);
        when(event.getEventDate()).thenReturn(LocalDate.of(2026, 2, 1));
        Bond bond = mock(Bond.class);
        when(bond.getId()).thenReturn(2L);
        Holding holding = mock(Holding.class);
        when(holding.getId()).thenReturn(1L);
        when(holding.getPurchaseDate()).thenReturn(LocalDate.of(2026, 1, 10));
        when(bonds.findAllByIssuerIdOrderByIdAsc(3L)).thenReturn(List.of(bond));
        when(holdings.findAllByBondIdOrderByIdAsc(2L)).thenReturn(List.of(holding));
        when(alerts.findByFingerprint(anyString())).thenReturn(Optional.empty());

        var result = service(alerts, bonds, holdings).generate(event, List.of());

        ArgumentCaptor<Alert> captor = ArgumentCaptor.forClass(Alert.class);
        verify(alerts).save(captor.capture());
        assertThat(result.created()).isEqualTo(1);
        assertThat(captor.getValue().getRiskEventId()).isEqualTo(8L);
        assertThat(captor.getValue().getRiskChangeId()).isNull();
    }

    @Test
    void anOrdinaryEventWithoutRiskChangeCreatesNoAlert() {
        AlertRepository alerts = mock(AlertRepository.class);
        BondRepository bonds = mock(BondRepository.class);
        HoldingRepository holdings = mock(HoldingRepository.class);
        RiskEvent event = mock(RiskEvent.class);
        when(event.getId()).thenReturn(9L);
        when(event.getIssuerId()).thenReturn(3L);
        when(event.getEventType()).thenReturn(RiskEventType.DEBT_INCREASE);
        Bond bond = mock(Bond.class);
        when(bond.getId()).thenReturn(2L);
        Holding holding = mock(Holding.class);
        when(holding.getId()).thenReturn(1L);
        when(bonds.findAllByIssuerIdOrderByIdAsc(3L)).thenReturn(List.of(bond));
        when(holdings.findAllByBondIdOrderByIdAsc(2L)).thenReturn(List.of(holding));

        var result = service(alerts, bonds, holdings).generate(event, List.of());

        assertThat(result.created()).isZero();
        assertThat(result.reused()).isZero();
        verify(alerts, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void anEventBeforeTheHoldingPurchaseDateCreatesNoHoldingAlert() {
        AlertRepository alerts = mock(AlertRepository.class);
        BondRepository bonds = mock(BondRepository.class);
        HoldingRepository holdings = mock(HoldingRepository.class);
        RiskEvent event = mock(RiskEvent.class);
        when(event.getId()).thenReturn(10L);
        when(event.getIssuerId()).thenReturn(3L);
        when(event.getEventType()).thenReturn(RiskEventType.LIQUIDITY_WARNING);
        when(event.getEventDate()).thenReturn(LocalDate.of(2025, 12, 31));
        Bond bond = mock(Bond.class);
        when(bond.getId()).thenReturn(2L);
        Holding holding = mock(Holding.class);
        when(holding.getId()).thenReturn(1L);
        when(holding.getPurchaseDate()).thenReturn(LocalDate.of(2026, 1, 10));
        when(bonds.findAllByIssuerIdOrderByIdAsc(3L)).thenReturn(List.of(bond));
        when(holdings.findAllByBondIdOrderByIdAsc(2L)).thenReturn(List.of(holding));

        var result = service(alerts, bonds, holdings).generate(event, List.of());

        assertThat(result.created()).isZero();
        verify(alerts, never()).save(org.mockito.ArgumentMatchers.any());
    }

    private AlertGenerationService service(
        AlertRepository alerts,
        BondRepository bonds,
        HoldingRepository holdings
    ) {
        IssuerRepository issuers = mock(IssuerRepository.class);
        Issuer issuer = mock(Issuer.class);
        when(issuer.getName()).thenReturn("한결산업");
        when(issuers.findById(3L)).thenReturn(Optional.of(issuer));
        WatchlistRepository watchlist = mock(WatchlistRepository.class);
        when(watchlist.findByBondId(org.mockito.ArgumentMatchers.anyLong())).thenReturn(Optional.empty());
        return new AlertGenerationService(
            alerts, bonds, holdings, watchlist, issuers,
            mock(IssuerRiskSnapshotRepository.class), new AlertPolicy(),
            Clock.fixed(Instant.parse("2026-09-11T00:00:00Z"), ZoneOffset.UTC)
        );
    }
}
