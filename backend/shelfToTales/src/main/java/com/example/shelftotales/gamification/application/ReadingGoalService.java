package com.example.shelftotales.gamification.application;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.gamification.domain.ReadingGoal;
import com.example.shelftotales.gamification.infrastructure.ReadingGoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReadingGoalService {
    private final ReadingGoalRepository readingGoalRepository;

    @Transactional(readOnly = true)
    public ReadingGoalResponse getActiveGoal(Long userId) {
        int currentYear = LocalDate.now().getYear();
        Optional<ReadingGoal> goalOpt = readingGoalRepository.findByUserIdAndTargetYear(userId, currentYear);
        if (goalOpt.isEmpty()) {
            return ReadingGoalResponse.builder()
                    .userId(userId)
                    .targetYear(currentYear)
                    .targetCount(24) // Default fallback goal
                    .build();
        }
        return mapToResponse(goalOpt.get());
    }

    @Transactional(readOnly = true)
    public ReadingGoalResponse getGoalForYear(Long userId, int year) {
        Optional<ReadingGoal> goalOpt = readingGoalRepository.findByUserIdAndTargetYear(userId, year);
        if (goalOpt.isEmpty()) {
            return ReadingGoalResponse.builder()
                    .userId(userId)
                    .targetYear(year)
                    .targetCount(24)
                    .build();
        }
        return mapToResponse(goalOpt.get());
    }

    @Transactional
    public ReadingGoalResponse saveOrUpdate(ReadingGoalRequest request, User user) {
        Optional<ReadingGoal> goalOpt = readingGoalRepository.findByUserIdAndTargetYear(user.getId(), request.getTargetYear());
        ReadingGoal goal;
        if (goalOpt.isPresent()) {
            goal = goalOpt.get();
            goal.setTargetCount(request.getTargetCount());
        } else {
            goal = ReadingGoal.builder()
                    .user(user)
                    .targetYear(request.getTargetYear())
                    .targetCount(request.getTargetCount())
                    .build();
        }
        return mapToResponse(readingGoalRepository.save(goal));
    }

    private ReadingGoalResponse mapToResponse(ReadingGoal goal) {
        return ReadingGoalResponse.builder()
                .id(goal.getId())
                .userId(goal.getUser().getId())
                .targetYear(goal.getTargetYear())
                .targetCount(goal.getTargetCount())
                .build();
    }
}
