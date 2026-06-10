package com.example.shelftotales.commerce.presentation;
import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.application.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class CouponController {
    private final CouponService couponService;

    @PostMapping("/api/coupons/validate")
    public ResponseEntity<Map<String, Object>> validate(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        BigDecimal orderTotal = new BigDecimal(body.getOrDefault("orderTotal", "0"));
        Coupon coupon = couponService.validate(code, orderTotal);
        BigDecimal discount = coupon.calculateDiscount(orderTotal);
        return ResponseEntity.ok(Map.of("valid", true, "discount", discount, "type", coupon.getType()));
    }

    @GetMapping("/api/admin/coupons")
    public ResponseEntity<?> listAll() {
        return ResponseEntity.ok(couponService.getAllCoupons());
    }

    @PostMapping("/api/admin/coupons")
    public ResponseEntity<Coupon> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(couponService.createCoupon(
                (String) body.get("code"), (String) body.get("type"),
                new BigDecimal(body.get("value").toString()),
                body.get("minOrderAmount") != null ? new BigDecimal(body.get("minOrderAmount").toString()) : null,
                body.get("maxDiscount") != null ? new BigDecimal(body.get("maxDiscount").toString()) : null,
                body.get("usageLimit") != null ? Integer.parseInt(body.get("usageLimit").toString()) : null,
                body.get("expiresAt") != null ? LocalDateTime.parse((String) body.get("expiresAt")) : null));
    }

    @PutMapping("/api/admin/coupons/{id}")
    public ResponseEntity<Coupon> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(couponService.updateCoupon(id,
                (String) body.get("code"), (String) body.get("type"),
                new BigDecimal(body.get("value").toString()),
                body.get("minOrderAmount") != null ? new BigDecimal(body.get("minOrderAmount").toString()) : null,
                body.get("maxDiscount") != null ? new BigDecimal(body.get("maxDiscount").toString()) : null,
                body.get("usageLimit") != null ? Integer.parseInt(body.get("usageLimit").toString()) : null,
                body.get("expiresAt") != null ? LocalDateTime.parse((String) body.get("expiresAt")) : null,
                body.get("active") != null ? (Boolean) body.get("active") : true));
    }

    @DeleteMapping("/api/admin/coupons/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.noContent().build();
    }
}
