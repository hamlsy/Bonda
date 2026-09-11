package com.bonda.portfolio.infrastructure;

import com.bonda.portfolio.domain.Watchlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {

    List<Watchlist> findAllByOrderByCreatedAtDesc();

    boolean existsByBondId(Long bondId);
}
