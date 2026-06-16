package com.example.shelftotales.commerce.application.payment;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * SSLCommerz payment gateway simulation.
 * Simulates the SSLCommerz session-based payment flow.
 *
 * In production, this would:
 * 1. Call SSLCommerz API to create a session
 * 2. Return a redirect URL for the customer to complete payment
 * 3. Receive IPN (Instant Payment Notification) callback
 *
 * Simulation behavior:
 * - Sessions are created with a unique session key
 * - Payment is auto-completed after "redirect" (simulated)
 * - Transactions up to ৳5,00,000 are approved
 * - Transaction ID format: SSL-{uuid}
 */
@Component
@Slf4j
public class SslCommerzPaymentGateway implements PaymentGateway {

    private static final BigDecimal MAX_TRANSACTION_LIMIT = new BigDecimal("500000.00");

    @Value("${payment.sslcommerz.simulation.enabled:true}")
    private boolean simulationEnabled;

    @Value("${payment.sslcommerz.store-id:demo_store}")
    private String storeId;

    @Value("${payment.sslcommerz.sandbox:true}")
    private boolean sandboxMode;

    @Override
    public String getGatewayName() { return "SSLCOMMERZ"; }

    @Override
    public PaymentResult processPayment(BigDecimal amount, String orderId, String customerEmail) {
        log.info("SSLCommerz payment initiated: order={}, amount={}, customer={}, store={}",
                orderId, amount, customerEmail, storeId);

        if (!simulationEnabled) {
            log.warn("SSLCommerz production mode not configured — falling back to simulation");
        }

        // Validate amount
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("SSLCommerz payment rejected: invalid amount={}", amount);
            return PaymentResult.failure("Invalid payment amount: " + amount);
        }

        // Simulate transaction limit
        if (amount.compareTo(MAX_TRANSACTION_LIMIT) > 0) {
            log.warn("SSLCommerz payment declined: amount {} exceeds limit {}", amount, MAX_TRANSACTION_LIMIT);
            return PaymentResult.failure("SSLCommerz transaction limit exceeded. Maximum is ৳5,00,000.");
        }

        // Generate simulated session and transaction
        String sessionKey = "SSL_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
        String transactionId = "SSL" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

        // Simulate the SSLCommerz session creation
        Map<String, String> sessionData = new HashMap<>();
        sessionData.put("sessionkey", sessionKey);
        sessionData.put("redirect_url", sandboxMode
                ? "https://sandbox.sslcommerz.com/process?sessionkey=" + sessionKey
                : "https://secure.sslcommerz.com/process?sessionkey=" + sessionKey);
        sessionData.put("store_id", storeId);
        sessionData.put("status", "VALID");
        sessionData.put("tran_id", transactionId);

        log.info("SSLCommerz session created: order={}, sessionId={}, transactionId={}, sandbox={}",
                orderId, sessionKey, transactionId, sandboxMode);
        log.info("SSLCommerz simulated redirect URL: {}", sessionData.get("redirect_url"));

        // In simulation mode, we auto-complete the payment
        log.info("SSLCommerz payment completed (simulation): order={}, transactionId={}, amount={}",
                orderId, transactionId, amount);

        return PaymentResult.success(transactionId);
    }
}
