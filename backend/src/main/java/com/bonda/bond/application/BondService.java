package com.bonda.bond.application;

import com.bonda.bond.domain.Bond;
import com.bonda.bond.infrastructure.BondRepository;
import com.bonda.issuer.domain.Issuer;
import com.bonda.issuer.infrastructure.IssuerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class BondService {

    private final BondRepository bondRepository;
    private final IssuerRepository issuerRepository;

    public BondService(BondRepository bondRepository, IssuerRepository issuerRepository) {
        this.bondRepository = bondRepository;
        this.issuerRepository = issuerRepository;
    }

    public List<BondView> findAll() {
        List<Bond> bonds = bondRepository.findAllByOrderByMaturityDateAsc();
        Map<Long, Issuer> issuers = issuerRepository.findAllById(
                bonds.stream().map(Bond::getIssuerId).collect(Collectors.toSet())
            ).stream()
            .collect(Collectors.toMap(Issuer::getId, Function.identity()));

        return bonds.stream()
            .map(bond -> toView(bond, requiredIssuer(issuers, bond.getIssuerId())))
            .toList();
    }

    public BondView findById(Long bondId) {
        Bond bond = bondRepository.findById(bondId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bond not found"));
        Issuer issuer = issuerRepository.findById(bond.getIssuerId())
            .orElseThrow(() -> new IllegalStateException("Issuer not found for bond " + bondId));
        return toView(bond, issuer);
    }

    public void requireExists(Long bondId) {
        if (!bondRepository.existsById(bondId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Bond not found");
        }
    }

    private Issuer requiredIssuer(Map<Long, Issuer> issuers, Long issuerId) {
        Issuer issuer = issuers.get(issuerId);
        if (issuer == null) {
            throw new IllegalStateException("Issuer not found for bond issuerId " + issuerId);
        }
        return issuer;
    }

    private BondView toView(Bond bond, Issuer issuer) {
        return new BondView(
            bond.getId(),
            new IssuerView(
                issuer.getId(),
                issuer.getCorpCode(),
                issuer.getName(),
                issuer.getStockCode()
            ),
            bond.getIsin(),
            bond.getBondCode(),
            bond.getName(),
            bond.getIssueDate(),
            bond.getMaturityDate(),
            bond.getCouponRate(),
            bond.getCreditRating(),
            bond.getCreatedAt()
        );
    }

    public record IssuerView(Long id, String corpCode, String name, String stockCode) {
    }

    public record BondView(
        Long id,
        IssuerView issuer,
        String isin,
        String bondCode,
        String name,
        LocalDate issueDate,
        LocalDate maturityDate,
        BigDecimal couponRate,
        String creditRating,
        Instant createdAt
    ) {
    }
}
