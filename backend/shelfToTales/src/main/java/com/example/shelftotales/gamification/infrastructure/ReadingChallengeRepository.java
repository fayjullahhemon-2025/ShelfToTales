package com.example.shelftotales.gamification.infrastructure;

import com.example.shelftotales.gamification.domain.*;
import com.example.shelftotales.auth.domain.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReadingChallengeRepository extends JpaRepository<ReadingChallenge, Long> {
    List<ReadingChallenge> findByEndDateAfterOrderByCreatedAtDesc(LocalDate date);
}
