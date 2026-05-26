package com.example.shelftotales.social.infrastructure;

import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.auth.domain.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {
    Page<UserNotification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    long countByUserIdAndReadFalse(Long userId);

    @Modifying
    @Query("UPDATE UserNotification n SET n.read = true WHERE n.user.id = :userId AND n.read = false")
    void markAllRead(@Param("userId") Long userId);
}
