package com.example.shelftotales.gamification.presentation;
import com.example.shelftotales.gamification.domain.*;
import com.example.shelftotales.gamification.application.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/streaks")
@RequiredArgsConstructor
public class StreakController {
    private final StreakService streakService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ReadingStreak> myStreak() {
        Long userId = AuthUtils.getCurrentUser(userRepository).getId();
        return ResponseEntity.ok(streakService.getStreak(userId));
    }
}
