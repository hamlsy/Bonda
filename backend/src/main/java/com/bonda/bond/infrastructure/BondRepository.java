package com.bonda.bond.infrastructure;

import com.bonda.bond.domain.Bond;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BondRepository extends JpaRepository<Bond, Long> {

    List<Bond> findAllByOrderByMaturityDateAsc();
}
