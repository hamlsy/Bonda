package com.bonda.sincebought.application;

public class ExplanationException extends RuntimeException {

    public ExplanationException(String message) {
        super(message);
    }

    public ExplanationException(String message, Throwable cause) {
        super(message, cause);
    }
}
