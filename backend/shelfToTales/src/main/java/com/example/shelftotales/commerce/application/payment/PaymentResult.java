package com.example.shelftotales.commerce.application.payment;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

public record PaymentResult(boolean success, String transactionId, String message) {
    public static PaymentResult success(String transactionId) {
        return new PaymentResult(true, transactionId, "Payment successful");
    }
    public static PaymentResult failure(String message) {
        return new PaymentResult(false, null, message);
    }
}
