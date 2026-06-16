package com.example.shelftotales.commerce.application.payment;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * bKash mobile wallet payment gateway.
 * Simulates bKash Checkout API flow. In production, replace with real bKash API calls.
 *
 * Simulation behavior:
 * - Transactions up to ৳25,000 are auto-approved
 * - Transactions above ৳25,000 are declined (simulating bKash limit)
 * - Transaction ID format: BK-{timestamp}-{random}
 */
@Component
@Slf4j
public class BkashPaymentGateway implements PaymentGateway {

    private static final BigDecimal MAX_TRANSACTION_LIMIT = new BigDecimal("25000.00");

    @Value("${payment.bkash.simulation.enabled:true}")
    private boolean simulationEnabled;

    @Value("${payment.bkash.simulation.failure-rate:0}")
    private int failureRatePercent;

    @Override
    public String getGatewayName() { return "BKASH"; }

    @Override
    public PaymentResult processPayment(BigDecimal amount, String orderId, String customerEmail) {
        log.info("bKash payment initiated: order={}, amount={}, customer={}", orderId, amount, customerEmail);

        if (!simulationEnabled) {
            log.warn("bKash production mode not configured — falling back to simulation");
        }

        // Validate amount
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("bKash payment rejected: invalid amount={}", amount);
            return PaymentResult.failure("Invalid payment amount: " + amount);
        }

        // Simulate bKash transaction limit
        if (amount.compareTo(MAX_TRANSACTION_LIMIT) > 0) {
            log.warn("bKash payment declined: amount {} exceeds limit {}", amount, MAX_TRANSACTION_LIMIT);
            return PaymentResult.failure("bKash transaction limit exceeded. Maximum per transaction is ৳25,000. " +
                    "Your amount: ৳" + amount.toPlainString() + ". Please use a different payment method.");
        }

        // Simulate random failure based on configured rate
        if (failureRatePercent > 0 && (System.nanoTime() % 100) < failureRatePercent) {
            log.warn("bKash payment simulated failure for order={}", orderId);
            return PaymentResult.failure("bKash payment could not be completed. Please try again or use a different payment method.");
        }

        // Generate simulated bKash transaction ID
        String transactionId = "BK" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        log.info("bKash payment successful: order={}, transactionId={}, amount={}", orderId, transactionId, amount);

        return PaymentResult.success(transactionId);
    }
}
