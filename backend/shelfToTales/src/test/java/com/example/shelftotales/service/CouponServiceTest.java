package com.example.shelftotales.service;
import com.example.shelftotales.review.domain.*;
import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.auth.application.*;
import com.example.shelftotales.auth.infrastructure.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.catalog.application.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.bookshelf.application.*;
import com.example.shelftotales.bookshelf.infrastructure.*;
import com.example.shelftotales.bookshelf.presentation.*;
import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.application.*;
import com.example.shelftotales.commerce.infrastructure.*;
import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.social.application.*;
import com.example.shelftotales.social.infrastructure.*;
import com.example.shelftotales.gamification.domain.*;
import com.example.shelftotales.gamification.application.*;
import com.example.shelftotales.gamification.infrastructure.*;
import com.example.shelftotales.exchange.domain.*;
import com.example.shelftotales.exchange.application.*;
import com.example.shelftotales.exchange.infrastructure.*;
import com.example.shelftotales.ai.application.*;
import com.example.shelftotales.readingroom.domain.*;
import com.example.shelftotales.readingroom.application.*;
import com.example.shelftotales.readingroom.infrastructure.*;
import com.example.shelftotales.review.application.*;
import com.example.shelftotales.review.infrastructure.*;
import com.example.shelftotales.wishlist.application.*;
import com.example.shelftotales.wishlist.infrastructure.*;
import com.example.shelftotales.shared.security.*;
import com.example.shelftotales.shared.util.*;
import com.example.shelftotales.auth.presentation.*;
import com.example.shelftotales.shared.dto.*;

import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.application.*;
import com.example.shelftotales.commerce.infrastructure.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.shared.util.AuthUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock private CouponRepository couponRepository;
    @Mock private CouponUsageRepository couponUsageRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private CouponService couponService;

    @Test
    void validate_validCoupon_returns() {
        User user = User.builder().id(1L).build();
        Coupon coupon = Coupon.builder().id(1L).code("SAVE10").type("PERCENTAGE")
                .value(BigDecimal.TEN).minOrderAmount(BigDecimal.ZERO).active(true).usedCount(0).build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(coupon));
            when(couponUsageRepository.existsByCouponIdAndUserId(1L, 1L)).thenReturn(false);

            Coupon result = couponService.validate("save10", BigDecimal.valueOf(100));
            assertEquals("SAVE10", result.getCode());
        }
    }

    @Test
    void validate_expiredCoupon_throws() {
        User user = User.builder().id(1L).build();
        Coupon coupon = Coupon.builder().id(1L).code("EXPIRED").type("PERCENTAGE")
                .value(BigDecimal.TEN).active(true).usedCount(0)
                .expiresAt(LocalDateTime.now().minusDays(1)).build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(couponRepository.findByCode("EXPIRED")).thenReturn(Optional.of(coupon));

            assertThrows(IllegalArgumentException.class,
                    () -> couponService.validate("EXPIRED", BigDecimal.valueOf(100)));
        }
    }

    @Test
    void validate_alreadyUsed_throws() {
        User user = User.builder().id(1L).build();
        Coupon coupon = Coupon.builder().id(1L).code("USED").type("PERCENTAGE")
                .value(BigDecimal.TEN).active(true).usedCount(0).build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(couponRepository.findByCode("USED")).thenReturn(Optional.of(coupon));
            when(couponUsageRepository.existsByCouponIdAndUserId(1L, 1L)).thenReturn(true);

            assertThrows(IllegalArgumentException.class,
                    () -> couponService.validate("USED", BigDecimal.valueOf(100)));
        }
    }

    @Test
    void calculateDiscount_percentage_withCap() {
        Coupon coupon = Coupon.builder().type("PERCENTAGE").value(BigDecimal.valueOf(20))
                .minOrderAmount(BigDecimal.ZERO).maxDiscount(BigDecimal.valueOf(50)).build();

        BigDecimal discount = coupon.calculateDiscount(BigDecimal.valueOf(500));
        assertEquals(0, BigDecimal.valueOf(50).compareTo(discount)); // 20% of 500 = 100, capped at 50
    }

    @Test
    void calculateDiscount_fixedAmount() {
        Coupon coupon = Coupon.builder().type("FIXED_AMOUNT").value(BigDecimal.valueOf(30))
                .minOrderAmount(BigDecimal.ZERO).build();

        BigDecimal discount = coupon.calculateDiscount(BigDecimal.valueOf(100));
        assertEquals(0, BigDecimal.valueOf(30).compareTo(discount));
    }
}
