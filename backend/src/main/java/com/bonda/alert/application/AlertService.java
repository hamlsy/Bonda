package com.bonda.alert.application;

import com.bonda.alert.domain.Alert;
import com.bonda.alert.domain.AlertSeverity;
import com.bonda.alert.infrastructure.AlertRepository;
import com.bonda.bond.domain.Bond;
import com.bonda.bond.infrastructure.BondRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AlertService {

    private final AlertRepository alertRepository;
    private final BondRepository bondRepository;
    private final Clock clock;

    @Autowired
    public AlertService(AlertRepository alertRepository, BondRepository bondRepository) {
        this(alertRepository, bondRepository, Clock.systemUTC());
    }

    AlertService(AlertRepository alertRepository, BondRepository bondRepository, Clock clock) {
        this.alertRepository = alertRepository;
        this.bondRepository = bondRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<AlertView> findAll(boolean unreadOnly, int limit) {
        if (limit < 1 || limit > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "limit must be between 1 and 100");
        }
        List<Alert> alerts = unreadOnly
            ? alertRepository.findAllByReadFalseOrderByCreatedAtDescIdDesc(PageRequest.of(0, limit))
            : alertRepository.findAllByOrderByCreatedAtDescIdDesc(PageRequest.of(0, limit));
        Map<Long, Bond> bonds = bondRepository.findAllById(
                alerts.stream().map(Alert::getBondId).collect(Collectors.toSet())
            ).stream().collect(Collectors.toMap(Bond::getId, Function.identity()));
        return alerts.stream().map(alert -> view(alert, requiredBond(bonds, alert.getBondId()))).toList();
    }

    @Transactional
    public AlertView markRead(Long alertId) {
        Alert alert = alertRepository.findById(alertId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alert not found"));
        alert.markRead(clock.instant());
        Bond bond = bondRepository.findById(alert.getBondId())
            .orElseThrow(() -> new IllegalStateException("Bond not found for alert"));
        return view(alert, bond);
    }

    AlertView view(Alert alert, Bond bond) {
        Target target = target(alert);
        return new AlertView(
            alert.getId(), alert.getSeverity(), alert.getTitle(), alert.getMessage(),
            alert.getBondId(), bond.getName(), alert.getHoldingId(), alert.getWatchlistId(),
            alert.getRiskEventId(), alert.getRiskChangeId(), alert.getCreatedAt(), alert.isRead(),
            alert.getReadAt(), target.type(), target.id()
        );
    }

    private Target target(Alert alert) {
        if (alert.getRiskEventId() != null) {
            return new Target("RISK_EVENT", alert.getRiskEventId());
        }
        if (alert.getHoldingId() != null) {
            return new Target("SINCE_BOUGHT", alert.getHoldingId());
        }
        return new Target("WATCHLIST", alert.getWatchlistId());
    }

    private Bond requiredBond(Map<Long, Bond> bonds, Long bondId) {
        Bond bond = bonds.get(bondId);
        if (bond == null) throw new IllegalStateException("Bond not found for alert");
        return bond;
    }

    private record Target(String type, Long id) {
    }

    public record AlertView(
        Long alertId,
        AlertSeverity severity,
        String title,
        String message,
        Long bondId,
        String bondName,
        Long holdingId,
        Long watchlistId,
        Long riskEventId,
        Long riskChangeId,
        Instant createdAt,
        boolean isRead,
        Instant readAt,
        String targetType,
        Long targetId
    ) {
    }
}

