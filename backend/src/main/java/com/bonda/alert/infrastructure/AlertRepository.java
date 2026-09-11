package com.bonda.alert.infrastructure;

import com.bonda.alert.domain.Alert;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    Optional<Alert> findByFingerprint(String fingerprint);

    List<Alert> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);

    List<Alert> findAllByReadFalseOrderByCreatedAtDescIdDesc(Pageable pageable);

    long countByHoldingIdAndReadFalse(Long holdingId);

    Optional<Alert> findFirstByHoldingIdOrderByCreatedAtDescIdDesc(Long holdingId);
}

