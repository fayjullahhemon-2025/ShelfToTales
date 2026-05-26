package com.example.shelftotales.gamification.infrastructure;

import com.example.shelftotales.gamification.domain.*;
import com.example.shelftotales.auth.domain.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserChallengeRepository extends JpaRepository<UserChallenge, Long> {
    List<UserChallenge> findByUserIdAndCompletedFalse(Long userId);
    List<UserChallenge> findByUserId(Long userId);
    boolean existsByUserIdAndChallengeId(Long userId, Long challengeId);
}
