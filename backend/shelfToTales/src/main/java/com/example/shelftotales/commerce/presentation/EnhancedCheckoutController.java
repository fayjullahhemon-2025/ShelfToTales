package com.example.shelftotales.commerce.presentation;
import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.application.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
public class EnhancedCheckoutController {
    private final EnhancedCheckoutService checkoutService;

    @PostMapping
    public ResponseEntity<Order> checkout(@RequestBody Map<String, Object> body) {
        Long addressId = Long.parseLong(body.get("addressId").toString());
        String paymentMethod = (String) body.getOrDefault("paymentMethod", "COD");
        String couponCode = (String) body.get("couponCode");
        return ResponseEntity.ok(checkoutService.checkout(addressId, paymentMethod, couponCode));
    }
}
