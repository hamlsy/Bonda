package com.bonda.alert.application;

import com.bonda.ai.domain.RiskEvent;
import com.bonda.alert.domain.Alert;
import com.bonda.alert.domain.AlertPolicy;
import com.bonda.alert.infrastructure.AlertRepository;
import com.bonda.bond.domain.Bond;
import com.bonda.bond.infrastructure.BondRepository;
import com.bonda.issuer.domain.Issuer;
import com.bonda.issuer.infrastructure.IssuerRepository;
import com.bonda.portfolio.domain.Holding;
import com.bonda.portfolio.domain.Watchlist;
import com.bonda.portfolio.infrastructure.HoldingRepository;
import com.bonda.portfolio.infrastructure.WatchlistRepository;
import com.bonda.risk.domain.IssuerRiskSnapshot;
import com.bonda.risk.domain.RiskChange;
import com.bonda.risk.domain.RiskState;
import com.bonda.risk.infrastructure.IssuerRiskSnapshotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.HexFormat;
import java.util.List;

@Service
public class AlertGenerationService {

    private static final ZoneId PRODUCT_ZONE = ZoneId.of("Asia/Seoul");

    private final AlertRepository alertRepository;
    private final BondRepository bondRepository;
    private final HoldingRepository holdingRepository;
    private final WatchlistRepository watchlistRepository;
    private final IssuerRepository issuerRepository;
    private final IssuerRiskSnapshotRepository riskSnapshotRepository;
    private final AlertPolicy policy;
    private final Clock clock;

    @Autowired
    public AlertGenerationService(
        AlertRepository alertRepository,
        BondRepository bondRepository,
        HoldingRepository holdingRepository,
        WatchlistRepository watchlistRepository,
        IssuerRepository issuerRepository,
        IssuerRiskSnapshotRepository riskSnapshotRepository,
        AlertPolicy policy
    ) {
        this(
            alertRepository, bondRepository, holdingRepository, watchlistRepository,
            issuerRepository, riskSnapshotRepository, policy, Clock.systemUTC()
        );
    }

    AlertGenerationService(
        AlertRepository alertRepository,
        BondRepository bondRepository,
        HoldingRepository holdingRepository,
        WatchlistRepository watchlistRepository,
        IssuerRepository issuerRepository,
        IssuerRiskSnapshotRepository riskSnapshotRepository,
        AlertPolicy policy,
        Clock clock
    ) {
        this.alertRepository = alertRepository;
        this.bondRepository = bondRepository;
        this.holdingRepository = holdingRepository;
        this.watchlistRepository = watchlistRepository;
        this.issuerRepository = issuerRepository;
        this.riskSnapshotRepository = riskSnapshotRepository;
        this.policy = policy;
        this.clock = clock;
    }

    @Transactional
    public GenerationResult generate(RiskEvent event, List<RiskChange> riskChanges) {
        if (event == null && riskChanges.isEmpty()) {
            return new GenerationResult(0, 0);
        }
        Long issuerId = event != null ? event.getIssuerId() : riskChanges.getFirst().getIssuerId();
        Issuer issuer = issuerRepository.findById(issuerId)
            .orElseThrow(() -> new IllegalStateException("Issuer not found for alert generation"));
        List<Bond> bonds = bondRepository.findAllByIssuerIdOrderByIdAsc(issuerId);
        int created = 0;
        int reused = 0;
        for (Bond bond : bonds) {
            List<Holding> holdings = holdingRepository.findAllByBondIdOrderByIdAsc(bond.getId());
            Watchlist watchlist = watchlistRepository.findByBondId(bond.getId()).orElse(null);
            if (!riskChanges.isEmpty()) {
                for (RiskChange change : riskChanges) {
                    AlertPolicy.Decision decision = policy.forRiskChange(issuer.getName(), change);
                    for (Holding holding : holdings) {
                        if (!isAfterPurchase(holding, null, change)) continue;
                        if (save(holding.getId(), null, bond, issuerId, null, change, decision)) created++;
                        else reused++;
                    }
                    if (watchlist != null) {
                        if (save(null, watchlist.getId(), bond, issuerId, null, change, decision)) created++;
                        else reused++;
                    }
                }
            } else if (event != null) {
                RiskState currentState = currentStateFor(event);
                AlertPolicy.Decision decision = policy.forRiskEvent(issuer.getName(), event, currentState).orElse(null);
                if (decision == null) {
                    continue;
                }
                for (Holding holding : holdings) {
                    if (!isAfterPurchase(holding, event, null)) continue;
                    if (save(holding.getId(), null, bond, issuerId, event, null, decision)) created++;
                    else reused++;
                }
                if (watchlist != null) {
                    if (save(null, watchlist.getId(), bond, issuerId, event, null, decision)) created++;
                    else reused++;
                }
            }
        }
        return new GenerationResult(created, reused);
    }

    private boolean isAfterPurchase(Holding holding, RiskEvent event, RiskChange change) {
        if (change != null) {
            Instant purchaseStart = holding.getPurchaseDate().atStartOfDay(PRODUCT_ZONE).toInstant();
            return !change.getDetectedAt().isBefore(purchaseStart);
        }
        return event != null && event.getEventDate() != null
            && !event.getEventDate().isBefore(holding.getPurchaseDate());
    }

    private boolean save(
        Long holdingId,
        Long watchlistId,
        Bond bond,
        Long issuerId,
        RiskEvent event,
        RiskChange change,
        AlertPolicy.Decision decision
    ) {
        String fingerprint = fingerprint(holdingId, watchlistId, event, change, decision);
        if (alertRepository.findByFingerprint(fingerprint).isPresent()) {
            return false;
        }
        alertRepository.save(Alert.create(
            holdingId,
            watchlistId,
            bond.getId(),
            issuerId,
            event == null ? null : event.getId(),
            change == null ? null : change.getId(),
            decision.severity(),
            decision.title(),
            decision.message(),
            fingerprint,
            clock.instant()
        ));
        return true;
    }

    private RiskState currentStateFor(RiskEvent event) {
        IssuerRiskSnapshot snapshot = riskSnapshotRepository
            .findFirstByIssuerIdOrderBySnapshotDateDescIdDesc(event.getIssuerId())
            .orElse(null);
        if (snapshot == null) {
            return RiskState.NORMAL;
        }
        return switch (event.getEventType()) {
            case CASH_DECREASE, LIQUIDITY_WARNING -> snapshot.getLiquidityState();
            case DEBT_INCREASE, GUARANTEE_INCREASE -> snapshot.getLeverageState();
            case OPERATING_LOSS -> snapshot.getEarningsState();
            case CREDIT_RATING_CHANGE -> snapshot.getCreditState();
        };
    }

    private String fingerprint(
        Long holdingId,
        Long watchlistId,
        RiskEvent event,
        RiskChange change,
        AlertPolicy.Decision decision
    ) {
        String value = "target=" + (holdingId == null ? "W" + watchlistId : "H" + holdingId)
            + "|event=" + (event == null ? "" : event.getId())
            + "|change=" + (change == null ? "" : change.getId())
            + "|transition=" + (change == null ? "" : change.getPreviousState() + ">" + change.getCurrentState())
            + "|severity=" + decision.severity();
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    public record GenerationResult(int created, int reused) {
    }
}
