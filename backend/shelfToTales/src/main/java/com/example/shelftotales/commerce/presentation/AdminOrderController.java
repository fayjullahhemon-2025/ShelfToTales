package com.example.shelftotales.commerce.presentation;
import com.example.shelftotales.commerce.infrastructure.*;
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
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {
    private final OrderRepository orderRepository;

    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + id));

        String statusStr = body.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }

        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid order status: " + statusStr +
                    ". Valid values: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED");
        }

        order.transitionTo(newStatus);

        if (body.containsKey("trackingNumber")) {
            order.setTrackingNumber(body.get("trackingNumber"));
        }

        return ResponseEntity.ok(orderRepository.save(order));
    }
}
