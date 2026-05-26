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

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.shared.util.AuthUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FollowServiceTest {

    @Mock private FollowRepository followRepository;
    @Mock private UserRepository userRepository;
    @Mock private UserBlockRepository userBlockRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @InjectMocks private FollowService followService;

    @Test
    void follow_success() {
        User currentUser = User.builder().id(1L).fullName("Alice").build();
        User target = User.builder().id(2L).fullName("Bob").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(currentUser);
            when(userRepository.findById(2L)).thenReturn(Optional.of(target));
            when(followRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(false);
            when(userBlockRepository.existsByBlockerIdAndBlockedId(2L, 1L)).thenReturn(false);

            followService.follow(2L);

            verify(followRepository).save(any(Follow.class));
        }
    }

    @Test
    void follow_self_throws() {
        User currentUser = User.builder().id(1L).build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(currentUser);

            assertThrows(IllegalArgumentException.class, () -> followService.follow(1L));
        }
    }

    @Test
    void follow_blocked_throws() {
        User currentUser = User.builder().id(1L).build();
        User target = User.builder().id(2L).build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(currentUser);
            when(userRepository.findById(2L)).thenReturn(Optional.of(target));
            when(userBlockRepository.existsByBlockerIdAndBlockedId(2L, 1L)).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () -> followService.follow(2L));
        }
    }

    @Test
    void follow_alreadyFollowing_noOp() {
        User currentUser = User.builder().id(1L).build();
        User target = User.builder().id(2L).build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(currentUser);
            when(userRepository.findById(2L)).thenReturn(Optional.of(target));
            when(userBlockRepository.existsByBlockerIdAndBlockedId(2L, 1L)).thenReturn(false);
            when(followRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(true);

            followService.follow(2L);

            verify(followRepository, never()).save(any());
        }
    }

    @Test
    void unfollow_success() {
        User currentUser = User.builder().id(1L).build();
        Follow follow = Follow.builder().id(10L).build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(currentUser);
            when(followRepository.findByFollowerIdAndFollowingId(1L, 2L)).thenReturn(Optional.of(follow));

            followService.unfollow(2L);

            verify(followRepository).delete(follow);
        }
    }
}
