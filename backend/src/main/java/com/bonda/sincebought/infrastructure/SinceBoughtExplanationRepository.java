package com.bonda.sincebought.infrastructure;

import com.bonda.sincebought.domain.SinceBoughtExplanation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SinceBoughtExplanationRepository extends JpaRepository<SinceBoughtExplanation, Long> {

    Optional<SinceBoughtExplanation> findByInputFingerprint(String inputFingerprint);
}
