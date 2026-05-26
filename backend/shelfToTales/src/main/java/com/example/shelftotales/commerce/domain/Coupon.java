package com.example.shelftotales.commerce.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Coupon {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false, length = 20)
    private String type; // PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING

    @Column(name = "\"value\"", nullable = false, precision = 10, scale = 2)
    private BigDecimal value;

    @Column(name = "min_order_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Column(name = "max_discount", precision = 10, scale = 2)
    private BigDecimal maxDiscount;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private int usedCount = 0;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Builder.Default
    private boolean active = true;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public boolean isValid() {
        if (!active) return false;
        if (expiresAt != null && LocalDateTime.now().isAfter(expiresAt)) return false;
        if (usageLimit != null && usedCount >= usageLimit) return false;
        return true;
    }

    public BigDecimal calculateDiscount(BigDecimal orderTotal) {
        if (orderTotal.compareTo(minOrderAmount) < 0) return BigDecimal.ZERO;
        BigDecimal discount = switch (type) {
            case "PERCENTAGE" -> orderTotal.multiply(value).divide(BigDecimal.valueOf(100));
            case "FIXED_AMOUNT" -> value;
            default -> BigDecimal.ZERO;
        };
        if (maxDiscount != null && discount.compareTo(maxDiscount) > 0) {
            discount = maxDiscount;
        }
        return discount.min(orderTotal);
    }
}
