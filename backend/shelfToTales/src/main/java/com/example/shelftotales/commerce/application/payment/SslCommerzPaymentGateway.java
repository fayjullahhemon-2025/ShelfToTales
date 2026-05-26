package com.example.shelftotales.commerce.application.payment;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * SSLCommerz payment gateway stub.
 * In production, this would call the SSLCommerz API to initiate a session
 * and return a redirect URL. For now, it simulates a successful payment.
 */
@Component
@Slf4j
public class SslCommerzPaymentGateway implements PaymentGateway {

    @Override
    public String getGatewayName() { return "SSLCOMMERZ"; }

    @Override
    public PaymentResult processPayment(BigDecimal amount, String orderId, String customerEmail) {
        log.info("SSLCommerz payment initiated: order={}, amount={}", orderId, amount);
        // Stub: simulate success. Real implementation would call SSLCommerz API.
        return PaymentResult.success("SSL-" + UUID.randomUUID().toString().substring(0, 8));
    }
}
