package com.example.shelftotales.commerce.application.payment;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.UUID;

@Component
public class CodPaymentGateway implements PaymentGateway {

    @Override
    public String getGatewayName() { return "COD"; }

    @Override
    public PaymentResult processPayment(BigDecimal amount, String orderId, String customerEmail) {
        // COD always succeeds — payment collected on delivery
        return PaymentResult.success("COD-" + UUID.randomUUID().toString().substring(0, 8));
    }
}
