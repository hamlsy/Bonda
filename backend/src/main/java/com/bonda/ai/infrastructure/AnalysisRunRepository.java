package com.bonda.ai.infrastructure;

import com.bonda.ai.domain.AnalysisRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AnalysisRunRepository extends JpaRepository<AnalysisRun, Long> {

    Optional<AnalysisRun> findFirstByDisclosureVersionIdAndStatusOrderByIdDesc(
        Long disclosureVersionId,
        AnalysisRun.Status status
    );

    Optional<AnalysisRun> findFirstByDocumentHashAndModelAndPromptVersionAndStatusOrderByIdDesc(
        String documentHash,
        String model,
        String promptVersion,
        AnalysisRun.Status status
    );
}
