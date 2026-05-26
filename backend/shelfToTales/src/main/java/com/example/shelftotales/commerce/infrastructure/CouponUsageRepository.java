package com.example.shelftotales.commerce.infrastructure;

import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.auth.domain.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {
    boolean existsByCouponIdAndUserId(Long couponId, Long userId);
}
