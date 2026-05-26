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

import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.social.application.*;
import com.example.shelftotales.social.infrastructure.*;

import com.example.shelftotales.social.application.SocialActivityResponse;
import com.example.shelftotales.auth.application.UserSummaryResponse;
import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.shared.util.AuthUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SocialServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SocialActivityRepository socialActivityRepository;

    @InjectMocks
    private SocialService socialService;

    private User currentUser;
    private User targetUser;
    private SocialActivity followActivity;

    @BeforeEach
    void setUp() {
        currentUser = User.builder()
                .id(1L)
                .email("current@example.com")
                .fullName("Current User")
                .role(Role.USER)
                .following(new HashSet<>())
                .followers(new HashSet<>())
                .build();

        targetUser = User.builder()
                .id(2L)
                .email("target@example.com")
                .fullName("Target User")
                .role(Role.USER)
                .following(new HashSet<>())
                .followers(new HashSet<>())
                .build();

        followActivity = SocialActivity.builder()
                .id(100L)
                .user(currentUser)
                .type("FOLLOW")
                .referenceId(2L)
                .content("Current User followed Target User")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void followUser_success() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(currentUser);
            when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));

            socialService.followUser(2L);

            assertTrue(currentUser.getFollowing().contains(targetUser));
            verify(userRepository).save(currentUser);
            verify(socialActivityRepository).save(any(SocialActivity.class));
        }
    }

    @Test
    void followUser_selfFollow_throwsException() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(currentUser);

            assertThrows(IllegalArgumentException.class, () -> socialService.followUser(1L));
            verify(userRepository, never()).save(any());
            verify(socialActivityRepository, never()).save(any());
        }
    }

    @Test
    void unfollowUser_success() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(currentUser);
            currentUser.getFollowing().add(targetUser);
            when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));

            socialService.unfollowUser(2L);

            assertFalse(currentUser.getFollowing().contains(targetUser));
            verify(userRepository).save(currentUser);
        }
    }

    @Test
    void searchUsers_returnsMatchingUsers() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(currentUser);
            when(userRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase("target", "target"))
                    .thenReturn(List.of(targetUser));

            List<UserSummaryResponse> results = socialService.searchUsers("target");

            assertEquals(1, results.size());
            assertEquals("Target User", results.get(0).getFullName());
        }
    }

    @Test
    void getActivityFeed_returnsActivities() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(currentUser);
            currentUser.getFollowing().add(targetUser);

            when(socialActivityRepository.findByUserInOrderByCreatedAtDesc(anyCollection()))
                    .thenReturn(List.of(followActivity));

            List<SocialActivityResponse> feed = socialService.getActivityFeed();

            assertNotNull(feed);
            assertEquals(1, feed.size());
            assertEquals("FOLLOW", feed.get(0).getType());
            assertEquals("Current User followed Target User", feed.get(0).getContent());
        }
    }
}
