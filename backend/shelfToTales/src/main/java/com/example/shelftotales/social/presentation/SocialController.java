package com.example.shelftotales.social.presentation;
import com.example.shelftotales.social.application.*;
import com.example.shelftotales.social.infrastructure.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.social.application.FollowResponse;
import com.example.shelftotales.social.application.SocialActivityResponse;
import com.example.shelftotales.auth.application.UserSummaryResponse;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialController {

    private final SocialService socialService;
    private final FollowService followService;
    private final UserRepository userRepository;

    @PostMapping("/follow/{userId}")
    public ResponseEntity<Void> followUser(@PathVariable Long userId) {
        followService.follow(userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/follow/{userId}")
    public ResponseEntity<Void> unfollowUser(@PathVariable Long userId) {
        followService.unfollow(userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/followers")
    public ResponseEntity<Page<FollowResponse>> getFollowers(Pageable pageable) {
        Long userId = AuthUtils.getCurrentUser(userRepository).getId();
        return ResponseEntity.ok(followService.getFollowers(userId, pageable));
    }

    @GetMapping("/following")
    public ResponseEntity<Page<FollowResponse>> getFollowing(Pageable pageable) {
        Long userId = AuthUtils.getCurrentUser(userRepository).getId();
        return ResponseEntity.ok(followService.getFollowing(userId, pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserSummaryResponse>> searchUsers(@RequestParam("q") String query) {
        return ResponseEntity.ok(socialService.searchUsers(query));
    }

    @GetMapping("/feed")
    public ResponseEntity<List<SocialActivityResponse>> getActivityFeed() {
        return ResponseEntity.ok(socialService.getActivityFeed());
    }
}
