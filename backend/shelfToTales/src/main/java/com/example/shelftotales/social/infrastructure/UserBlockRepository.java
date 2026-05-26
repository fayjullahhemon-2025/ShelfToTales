package com.example.shelftotales.social.infrastructure;

import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.auth.domain.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {
    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
    void deleteByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
}
