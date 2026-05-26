package com.example.shelftotales.gamification.presentation;
import com.example.shelftotales.gamification.domain.*;
import com.example.shelftotales.gamification.application.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeController {
    private final ChallengeService challengeService;

    @GetMapping
    public ResponseEntity<List<ReadingChallenge>> available() {
        return ResponseEntity.ok(challengeService.getAvailableChallenges());
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Void> join(@PathVariable Long id) {
        challengeService.joinChallenge(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/mine")
    public ResponseEntity<List<UserChallenge>> mine() {
        return ResponseEntity.ok(challengeService.getMyChallenges());
    }
}
