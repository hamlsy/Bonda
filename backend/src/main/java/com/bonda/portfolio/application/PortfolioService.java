package com.bonda.portfolio.application;

import com.bonda.bond.application.BondService;
import com.bonda.bond.application.BondService.BondView;
import com.bonda.portfolio.domain.Holding;
import com.bonda.portfolio.domain.Watchlist;
import com.bonda.portfolio.infrastructure.HoldingRepository;
import com.bonda.portfolio.infrastructure.WatchlistRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class PortfolioService {

    private final HoldingRepository holdingRepository;
    private final WatchlistRepository watchlistRepository;
    private final BondService bondService;

    public PortfolioService(
        HoldingRepository holdingRepository,
        WatchlistRepository watchlistRepository,
        BondService bondService
    ) {
        this.holdingRepository = holdingRepository;
        this.watchlistRepository = watchlistRepository;
        this.bondService = bondService;
    }

    @Transactional
    public HoldingView createHolding(Long bondId, LocalDate purchaseDate, BigDecimal purchaseAmount) {
        bondService.requireExists(bondId);
        Holding holding = holdingRepository.save(Holding.create(bondId, purchaseDate, purchaseAmount));
        return toView(holding);
    }

    @Transactional(readOnly = true)
    public List<HoldingView> findHoldings() {
        return holdingRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(this::toView)
            .toList();
    }

    @Transactional
    public void deleteHolding(Long holdingId) {
        Holding holding = holdingRepository.findById(holdingId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Holding not found"));
        holdingRepository.delete(holding);
    }

    @Transactional
    public WatchlistView createWatchlist(Long bondId) {
        bondService.requireExists(bondId);
        if (watchlistRepository.existsByBondId(bondId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bond is already in watchlist");
        }

        try {
            Watchlist watchlist = watchlistRepository.saveAndFlush(Watchlist.create(bondId));
            return toView(watchlist);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Bond is already in watchlist",
                exception
            );
        }
    }

    @Transactional(readOnly = true)
    public List<WatchlistView> findWatchlist() {
        return watchlistRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(this::toView)
            .toList();
    }

    @Transactional
    public void deleteWatchlist(Long watchlistId) {
        Watchlist watchlist = watchlistRepository.findById(watchlistId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Watchlist entry not found"));
        watchlistRepository.delete(watchlist);
    }

    private HoldingView toView(Holding holding) {
        return new HoldingView(
            holding.getId(),
            bondService.findById(holding.getBondId()),
            holding.getPurchaseDate(),
            holding.getPurchaseAmount(),
            holding.getCreatedAt()
        );
    }

    private WatchlistView toView(Watchlist watchlist) {
        return new WatchlistView(
            watchlist.getId(),
            bondService.findById(watchlist.getBondId()),
            watchlist.getCreatedAt()
        );
    }

    public record HoldingView(
        Long id,
        BondView bond,
        LocalDate purchaseDate,
        BigDecimal purchaseAmount,
        Instant createdAt
    ) {
    }

    public record WatchlistView(Long id, BondView bond, Instant createdAt) {
    }
}
