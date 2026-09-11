package com.bonda.ai.infrastructure;

import com.bonda.ai.domain.CandidateRiskEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CandidateRiskEventRepository extends JpaRepository<CandidateRiskEvent, Long> {

    List<CandidateRiskEvent> findAllByAnalysisRunIdOrderByIdAsc(Long analysisRunId);
}
