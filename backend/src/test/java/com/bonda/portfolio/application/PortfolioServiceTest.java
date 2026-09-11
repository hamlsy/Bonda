package com.bonda.portfolio.application;

import com.bonda.bond.application.BondService;
import com.bonda.bond.application.BondService.BondView;
import com.bonda.bond.application.BondService.IssuerView;
import com.bonda.portfolio.domain.Holding;
import com.bonda.portfolio.infrastructure.HoldingRepository;
import com.bonda.portfolio.infrastructure.WatchlistRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PortfolioServiceTest {

    @Mock
    private HoldingRepository holdingRepository;

    @Mock
    private WatchlistRepository watchlistRepository;

    @Mock
    private BondService bondService;

    @InjectMocks
    private PortfolioService portfolioService;

    @Test
    void createsHoldingOnlyForExistingBond() {
        BondView bond = demoBond();
        when(holdingRepository.save(any(Holding.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(bondService.findById(1L)).thenReturn(bond);

        PortfolioService.HoldingView result = portfolioService.createHolding(
            1L,
            LocalDate.of(2026, 1, 15),
            new BigDecimal("1000000.00")
        );

        verify(bondService).requireExists(1L);
        assertThat(result.bond()).isEqualTo(bond);
        assertThat(result.purchaseAmount()).isEqualByComparingTo("1000000.00");
    }

    @Test
    void rejectsDuplicateWatchlistEntry() {
        when(watchlistRepository.existsByBondId(1L)).thenReturn(true);

        assertThatThrownBy(() -> portfolioService.createWatchlist(1L))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("409 CONFLICT");

        verify(bondService).requireExists(1L);
        verify(watchlistRepository, never()).saveAndFlush(any());
    }

    private BondView demoBond() {
        return new BondView(
            1L,
            new IssuerView(1L, "DEMO0001", "[데모] 한결산업", null),
            "DEMO-ISIN-001",
            "DEMO-BOND-001",
            "[데모] 한결산업 1회 회사채",
            LocalDate.of(2025, 1, 15),
            LocalDate.of(2028, 1, 15),
            new BigDecimal("4.2500"),
            "AA-",
            Instant.parse("2025-01-15T00:00:00Z")
        );
    }
}
