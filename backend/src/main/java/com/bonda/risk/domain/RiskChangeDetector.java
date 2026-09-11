package com.bonda.risk.domain;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class RiskChangeDetector {

    public List<Transition> detect(IssuerRiskSnapshot current, IssuerRiskSnapshot previous) {
        List<Transition> transitions = new ArrayList<>();
        for (RiskCategory category : RiskCategory.values()) {
            RiskState previousState = previous == null ? RiskState.NORMAL : previous.state(category);
            RiskState currentState = current.state(category);
            if (previousState != currentState) {
                transitions.add(new Transition(category, previousState, currentState));
            }
        }
        return List.copyOf(transitions);
    }

    public record Transition(RiskCategory category, RiskState previousState, RiskState currentState) {
    }
}
