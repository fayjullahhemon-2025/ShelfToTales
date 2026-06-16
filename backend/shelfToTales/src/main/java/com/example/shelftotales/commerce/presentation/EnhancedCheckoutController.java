package com.example.shelftotales.commerce.presentation;
import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.application.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
@Slf4j
public class EnhancedCheckoutController {
    private final EnhancedCheckoutService checkoutService;

    private static final Set<String> SUPPORTED_PAYMENT_METHODS = Set.of("COD", "BKASH", "SSLCOMMERZ");

    @PostMapping
    public ResponseEntity<?> checkout(@RequestBody Map<String, Object> body) {
        try {
            Object addressIdObj = body.get("addressId");
            if (addressIdObj == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "status", 400,
                    "error", "Bad Request",
                    "message", "Shipping address is required. Please add an address before placing your order."
                ));
            }
            Long addressId;
            if (addressIdObj instanceof Number) {
                addressId = ((Number) addressIdObj).longValue();
            } else {
                addressId = Long.parseLong(addressIdObj.toString());
            }

            String paymentMethod = body.get("paymentMethod") != null
                    ? body.get("paymentMethod").toString().toUpperCase() : "COD";
            String couponCode = body.get("couponCode") != null
                    ? body.get("couponCode").toString().trim() : null;

            if (!SUPPORTED_PAYMENT_METHODS.contains(paymentMethod)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "status", 400,
                    "error", "Bad Request",
                    "message", "Invalid payment method: " + paymentMethod + ". Supported: COD, BKASH, SSLCOMMERZ"
                ));
            }

            OrderResponse order = checkoutService.checkout(addressId, paymentMethod, couponCode);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            log.warn("Checkout validation failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "status", 400,
                "error", "Bad Request",
                "message", e.getMessage()
            ));
        } catch (IllegalStateException e) {
            log.warn("Checkout payment failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "status", 400,
                "error", "Payment Failed",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Checkout error", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "status", 500,
                "error", "Internal Server Error",
                "message", "An unexpected error occurred during checkout. Please try again."
            ));
        }
    }
}
