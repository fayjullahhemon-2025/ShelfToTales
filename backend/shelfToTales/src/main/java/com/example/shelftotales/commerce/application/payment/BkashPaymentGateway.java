package com.example.shelftotales.commerce.application.payment;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * bKash mobile wallet payment gateway stub.
 * In production, this would call the bKash Checkout API.
 */
@Component
@Slf4j
public class BkashPaymentGateway implements PaymentGateway {

    @Override
    public String getGatewayName() { return "BKASH"; }

    @Override
    public PaymentResult processPayment(BigDecimal amount, String orderId, String customerEmail) {
        log.info("bKash payment initiated: order={}, amount={}", orderId, amount);
        // Stub: simulate success
        return PaymentResult.success("BK-" + UUID.randomUUID().toString().substring(0, 8));
    }
}
