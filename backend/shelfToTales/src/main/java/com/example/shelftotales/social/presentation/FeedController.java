package com.example.shelftotales.social.presentation;
import com.example.shelftotales.social.application.*;
import com.example.shelftotales.social.infrastructure.*;
import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.social.application.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.ai.application.DiscoverFeedService;
import com.example.shelftotales.ai.application.DiscoverFeedResponse;

import com.example.shelftotales.ai.application.DiscoverFeedResponse;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.ai.application.DiscoverFeedService;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feed")
@RequiredArgsConstructor
public class FeedController {
    private final ActivityFeedItemRepository feedRepository;
    private final FollowRepository followRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final DiscoverFeedService discoverFeedService;

    @GetMapping("/following")
    public ResponseEntity<Page<ActivityFeedItem>> followingFeed(Pageable pageable) {
        Long userId = AuthUtils.getCurrentUser(userRepository).getId();
        List<Long> followingIds = followRepository.findFollowingIds(userId);
        followingIds.add(userId);
        List<Long> friendIds = friendshipRepository.findFriendIds(userId);
        return ResponseEntity.ok(feedRepository.findFeedForUser(followingIds, friendIds, pageable));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<ActivityFeedItem>> userFeed(@PathVariable Long userId, Pageable pageable) {
        return ResponseEntity.ok(feedRepository.findByUserIdAndVisibilityOrderByCreatedAtDesc(userId, "PUBLIC", pageable));
    }

    @GetMapping("/discover")
    public ResponseEntity<DiscoverFeedResponse> discover() {
        return ResponseEntity.ok(discoverFeedService.getDiscoverFeed());
    }
}
