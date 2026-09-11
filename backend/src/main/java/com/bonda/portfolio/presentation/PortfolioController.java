package com.bonda.portfolio.presentation;

import com.bonda.portfolio.application.PortfolioService;
import com.bonda.portfolio.application.PortfolioService.HoldingView;
import com.bonda.portfolio.application.PortfolioService.WatchlistView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
class PortfolioController {

    private final PortfolioService portfolioService;

    PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @PostMapping("/holdings")
    ResponseEntity<HoldingView> createHolding(@Valid @RequestBody CreateHoldingRequest request) {
        HoldingView holding = portfolioService.createHolding(
            request.bondId(),
            request.purchaseDate(),
            request.purchaseAmount()
        );
        return ResponseEntity.created(URI.create("/api/holdings/" + holding.id())).body(holding);
    }

    @GetMapping("/holdings")
    List<HoldingView> findHoldings() {
        return portfolioService.findHoldings();
    }

    @DeleteMapping("/holdings/{holdingId}")
    ResponseEntity<Void> deleteHolding(@PathVariable Long holdingId) {
        portfolioService.deleteHolding(holdingId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/watchlist")
    ResponseEntity<WatchlistView> createWatchlist(@Valid @RequestBody CreateWatchlistRequest request) {
        WatchlistView watchlist = portfolioService.createWatchlist(request.bondId());
        return ResponseEntity.created(URI.create("/api/watchlist/" + watchlist.id())).body(watchlist);
    }

    @GetMapping("/watchlist")
    List<WatchlistView> findWatchlist() {
        return portfolioService.findWatchlist();
    }

    @DeleteMapping("/watchlist/{watchlistId}")
    ResponseEntity<Void> deleteWatchlist(@PathVariable Long watchlistId) {
        portfolioService.deleteWatchlist(watchlistId);
        return ResponseEntity.noContent().build();
    }

    record CreateHoldingRequest(
        @NotNull Long bondId,
        @NotNull @PastOrPresent LocalDate purchaseDate,
        @NotNull @DecimalMin("0.01") @Digits(integer = 17, fraction = 2) BigDecimal purchaseAmount
    ) {
    }

    record CreateWatchlistRequest(@NotNull Long bondId) {
    }
}
