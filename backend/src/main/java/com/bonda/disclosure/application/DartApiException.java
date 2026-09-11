package com.bonda.disclosure.application;

public class DartApiException extends RuntimeException {

    private final String requestType;
    private final String errorCode;

    public DartApiException(String requestType, String errorCode, String safeMessage) {
        super(safeMessage);
        this.requestType = requestType;
        this.errorCode = errorCode;
    }

    public String getRequestType() {
        return requestType;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
