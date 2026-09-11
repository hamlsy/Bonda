package com.bonda.portfolio.infrastructure;

import com.bonda.portfolio.domain.Holding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HoldingRepository extends JpaRepository<Holding, Long> {

    List<Holding> findAllByOrderByCreatedAtDesc();
}
