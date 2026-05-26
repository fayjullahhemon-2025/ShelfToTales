package com.example.shelftotales.commerce.application.payment;

import java.math.BigDecimal;

/**
 * Strategy pattern: defines how a payment is processed.
 * Each implementation handles a specific payment gateway.
 */
public interface PaymentGateway {
    String getGatewayName();
    PaymentResult processPayment(BigDecimal amount, String orderId, String customerEmail);
}
