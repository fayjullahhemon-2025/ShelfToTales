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

import com.example.shelftotales.gamification.domain.ReadingStreak;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.gamification.infrastructure.ReadingStreakRepository;
import com.example.shelftotales.gamification.application.StreakService;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StreakServiceTest {

    @Mock private ReadingStreakRepository streakRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private StreakService streakService;

    @Test
    void recordActivity_newUser_startsAtOne() {
        when(streakRepository.findById(1L)).thenReturn(Optional.empty());
        when(userRepository.getReferenceById(1L)).thenReturn(User.builder().id(1L).build());
        when(streakRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ReadingStreak result = streakService.recordActivity(1L);

        assertEquals(1, result.getCurrentStreak());
        assertEquals(1, result.getLongestStreak());
        assertEquals(LocalDate.now(), result.getLastReadDate());
    }

    @Test
    void recordActivity_consecutiveDay_increments() {
        ReadingStreak existing = ReadingStreak.builder()
                .userId(1L).currentStreak(5).longestStreak(5)
                .lastReadDate(LocalDate.now().minusDays(1)).build();
        when(streakRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(streakRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ReadingStreak result = streakService.recordActivity(1L);

        assertEquals(6, result.getCurrentStreak());
        assertEquals(6, result.getLongestStreak());
    }

    @Test
    void recordActivity_missedDay_resetsToOne() {
        ReadingStreak existing = ReadingStreak.builder()
                .userId(1L).currentStreak(10).longestStreak(10)
                .lastReadDate(LocalDate.now().minusDays(3)).build();
        when(streakRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(streakRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ReadingStreak result = streakService.recordActivity(1L);

        assertEquals(1, result.getCurrentStreak());
        assertEquals(10, result.getLongestStreak());
    }

    @Test
    void recordActivity_sameDay_noChange() {
        ReadingStreak existing = ReadingStreak.builder()
                .userId(1L).currentStreak(3).longestStreak(5)
                .lastReadDate(LocalDate.now()).build();
        when(streakRepository.findById(1L)).thenReturn(Optional.of(existing));

        ReadingStreak result = streakService.recordActivity(1L);

        assertEquals(3, result.getCurrentStreak());
        verify(streakRepository, never()).save(any());
    }
}
