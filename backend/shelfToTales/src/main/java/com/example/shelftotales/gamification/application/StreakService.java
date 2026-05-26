package com.example.shelftotales.gamification.application;
import com.example.shelftotales.gamification.domain.*;
import com.example.shelftotales.gamification.infrastructure.*;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class StreakService {

    private final ReadingStreakRepository streakRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReadingStreak recordActivity(Long userId) {
        ReadingStreak streak = streakRepository.findById(userId).orElseGet(() -> {
            User user = userRepository.getReferenceById(userId);
            return ReadingStreak.builder().user(user).userId(userId).build();
        });

        LocalDate today = LocalDate.now();
        if (today.equals(streak.getLastReadDate())) {
            return streak;
        }

        if (streak.getLastReadDate() != null && streak.getLastReadDate().plusDays(1).equals(today)) {
            streak.setCurrentStreak(streak.getCurrentStreak() + 1);
        } else {
            streak.setCurrentStreak(1);
        }

        if (streak.getCurrentStreak() > streak.getLongestStreak()) {
            streak.setLongestStreak(streak.getCurrentStreak());
        }

        streak.setLastReadDate(today);
        return streakRepository.save(streak);
    }

    @Transactional(readOnly = true)
    public ReadingStreak getStreak(Long userId) {
        return streakRepository.findById(userId)
                .orElse(ReadingStreak.builder().userId(userId).currentStreak(0).longestStreak(0).build());
    }
}
