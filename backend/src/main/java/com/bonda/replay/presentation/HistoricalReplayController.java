package com.bonda.replay.presentation;

import com.bonda.replay.application.HistoricalReplayService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/replay")
public class HistoricalReplayController {

    private final HistoricalReplayService replayService;

    public HistoricalReplayController(HistoricalReplayService replayService) {
        this.replayService = replayService;
    }

    @PostMapping
    public HistoricalReplayService.ReplayResult replay(@Valid @RequestBody ReplayRequest request) {
        return replayService.replay(request.issuerId(), request.cutoffDate());
    }

    public record ReplayRequest(@NotNull Long issuerId, @NotNull LocalDate cutoffDate) {
    }
}
