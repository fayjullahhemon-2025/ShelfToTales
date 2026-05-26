package com.example.shelftotales.gamification.presentation;
import com.example.shelftotales.gamification.infrastructure.*;
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

import java.util.List;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {
    private final AchievementService achievementService;
    private final AchievementRepository achievementRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Achievement>> all() {
        return ResponseEntity.ok(achievementRepository.findAll());
    }

    @GetMapping("/mine")
    public ResponseEntity<List<UserAchievement>> mine() {
        Long userId = AuthUtils.getCurrentUser(userRepository).getId();
        return ResponseEntity.ok(achievementService.getMyAchievements(userId));
    }
}
