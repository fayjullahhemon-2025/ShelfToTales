package com.example.shelftotales.gamification.application;
import com.example.shelftotales.gamification.domain.*;
import com.example.shelftotales.gamification.infrastructure.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.auth.infrastructure.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.bookshelf.infrastructure.*;
import com.example.shelftotales.wishlist.infrastructure.*;
import com.example.shelftotales.review.infrastructure.*;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChallengeService {

    private final ReadingChallengeRepository challengeRepository;
    private final UserChallengeRepository userChallengeRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ReadingChallenge> getAvailableChallenges() {
        return challengeRepository.findByEndDateAfterOrderByCreatedAtDesc(LocalDate.now());
    }

    @Transactional
    public void joinChallenge(Long challengeId) {
        User user = AuthUtils.getCurrentUser(userRepository);
        if (userChallengeRepository.existsByUserIdAndChallengeId(user.getId(), challengeId)) {
            throw new IllegalArgumentException("Already joined this challenge");
        }
        ReadingChallenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new IllegalArgumentException("Challenge not found"));
        userChallengeRepository.save(UserChallenge.builder().user(user).challenge(challenge).build());
    }

    @Transactional
    public void incrementProgress(Long userId, Long categoryId) {
        List<UserChallenge> active = userChallengeRepository.findByUserIdAndCompletedFalse(userId);
        for (UserChallenge uc : active) {
            if (!"BOOKS_COUNT".equals(uc.getChallenge().getTargetType())) continue;
            uc.setProgress(uc.getProgress() + 1);
            if (uc.getProgress() >= uc.getChallenge().getTargetValue()) {
                uc.setCompleted(true);
                uc.setCompletedAt(LocalDateTime.now());
            }
            userChallengeRepository.save(uc);
        }
    }

    @Transactional(readOnly = true)
    public List<UserChallenge> getMyChallenges() {
        User user = AuthUtils.getCurrentUser(userRepository);
        return userChallengeRepository.findByUserId(user.getId());
    }
}
