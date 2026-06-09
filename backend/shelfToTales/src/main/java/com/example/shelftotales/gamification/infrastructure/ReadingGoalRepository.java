package com.example.shelftotales.gamification.infrastructure;

import com.example.shelftotales.gamification.domain.ReadingGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ReadingGoalRepository extends JpaRepository<ReadingGoal, Long> {
    Optional<ReadingGoal> findByUserIdAndTargetYear(Long userId, int targetYear);
}
