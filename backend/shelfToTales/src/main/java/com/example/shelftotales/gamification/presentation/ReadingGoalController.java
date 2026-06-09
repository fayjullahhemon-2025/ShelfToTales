package com.example.shelftotales.gamification.presentation;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.gamification.application.ReadingGoalRequest;
import com.example.shelftotales.gamification.application.ReadingGoalResponse;
import com.example.shelftotales.gamification.application.ReadingGoalService;
import com.example.shelftotales.shared.util.AuthUtils;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class ReadingGoalController {
    private final ReadingGoalService readingGoalService;
    private final UserRepository userRepository;

    @GetMapping("/active")
    @Operation(summary = "Get the reading goal for the current year")
    public ResponseEntity<ReadingGoalResponse> getActiveGoal() {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        return ResponseEntity.ok(readingGoalService.getActiveGoal(currentUser.getId()));
    }

    @GetMapping("/{year}")
    @Operation(summary = "Get reading goal for a specific year")
    public ResponseEntity<ReadingGoalResponse> getGoalForYear(@PathVariable int year) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        return ResponseEntity.ok(readingGoalService.getGoalForYear(currentUser.getId(), year));
    }

    @PostMapping
    @Operation(summary = "Set or update reading goal")
    public ResponseEntity<ReadingGoalResponse> saveOrUpdate(@RequestBody ReadingGoalRequest request) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        return ResponseEntity.ok(readingGoalService.saveOrUpdate(request, currentUser));
    }
}
