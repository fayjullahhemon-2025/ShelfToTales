package com.example.shelftotales.commerce.application;
import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.infrastructure.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Coupon validate(String code, BigDecimal orderTotal) {
        User user = AuthUtils.getCurrentUser(userRepository);
        Coupon coupon = couponRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid coupon code"));

        if (!coupon.isValid()) {
            throw new IllegalArgumentException("Coupon is expired or fully used");
        }
        if (couponUsageRepository.existsByCouponIdAndUserId(coupon.getId(), user.getId())) {
            throw new IllegalArgumentException("You have already used this coupon");
        }
        if (orderTotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new IllegalArgumentException("Minimum order amount is " + coupon.getMinOrderAmount());
        }
        return coupon;
    }

    @Transactional
    public BigDecimal applyCoupon(String code, BigDecimal orderTotal, Order order) {
        User user = AuthUtils.getCurrentUser(userRepository);
        Coupon coupon = validate(code, orderTotal);

        BigDecimal discount = coupon.calculateDiscount(orderTotal);

        coupon.setUsedCount(coupon.getUsedCount() + 1);
        couponRepository.save(coupon);

        couponUsageRepository.save(CouponUsage.builder()
                .coupon(coupon).user(user).order(order).build());

        return discount;
    }

    @Transactional
    public Coupon createCoupon(String code, String type, BigDecimal value,
                               BigDecimal minOrderAmount, BigDecimal maxDiscount,
                               Integer usageLimit, java.time.LocalDateTime expiresAt) {
        return couponRepository.save(Coupon.builder()
                .code(code.toUpperCase()).type(type).value(value)
                .minOrderAmount(minOrderAmount != null ? minOrderAmount : BigDecimal.ZERO)
                .maxDiscount(maxDiscount).usageLimit(usageLimit).expiresAt(expiresAt)
                .build());
    }
}
