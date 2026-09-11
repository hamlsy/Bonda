package com.bonda.issuer.infrastructure;

import com.bonda.issuer.domain.Issuer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssuerRepository extends JpaRepository<Issuer, Long> {

    List<Issuer> findTop5ByOrderByIdAsc();
}
