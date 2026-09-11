package com.bonda.ai.application;

public class RiskExtractionException extends RuntimeException {

    private final ErrorType errorType;
    private final int attempts;

    public RiskExtractionException(ErrorType errorType, String message) {
        this(errorType, message, 1);
    }

    public RiskExtractionException(ErrorType errorType, String message, int attempts) {
        super(message);
        this.errorType = errorType;
        this.attempts = attempts;
    }

    public ErrorType getErrorType() {
        return errorType;
    }

    public int getAttempts() {
        return attempts;
    }

    public enum ErrorType {
        MISSING_API_KEY,
        TIMEOUT,
        RATE_LIMIT,
        CLIENT_ERROR,
        SERVER_ERROR,
        MALFORMED_JSON,
        SCHEMA_VALIDATION,
        EMPTY_RESPONSE,
        PROVIDER_ERROR,
        INTERNAL_ERROR
    }
}
