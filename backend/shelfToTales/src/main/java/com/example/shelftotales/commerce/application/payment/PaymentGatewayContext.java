package com.example.shelftotales.commerce.application.payment;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Context class for Payment Strategy pattern.
 * Resolves the correct gateway by name.
 */
@Component
public class PaymentGatewayContext {

    private final Map<String, PaymentGateway> gateways;

    public PaymentGatewayContext(List<PaymentGateway> gatewayList) {
        this.gateways = gatewayList.stream()
                .collect(Collectors.toMap(PaymentGateway::getGatewayName, Function.identity()));
    }

    public PaymentGateway getGateway(String name) {
        PaymentGateway gateway = gateways.get(name.toUpperCase());
        if (gateway == null) {
            throw new IllegalArgumentException("Unsupported payment method: " + name);
        }
        return gateway;
    }
}
