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
class FriendServiceTest {

    @Mock private FriendRequestRepository friendRequestRepository;
    @Mock private FriendshipRepository friendshipRepository;
    @Mock private UserBlockRepository userBlockRepository;
    @Mock private UserRepository userRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @InjectMocks private FriendService friendService;

    @Test
    void sendRequest_success() {
        User sender = User.builder().id(1L).build();
        User receiver = User.builder().id(2L).build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(sender);
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
            when(friendshipRepository.existsByUserIdAndFriendId(1L, 2L)).thenReturn(false);
            when(friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(1L, 2L, "PENDING")).thenReturn(false);
            when(userBlockRepository.existsByBlockerIdAndBlockedId(2L, 1L)).thenReturn(false);

            friendService.sendRequest(2L);

            verify(friendRequestRepository).save(any(FriendRequest.class));
        }
    }

    @Test
    void acceptRequest_createsBidirectionalFriendship() {
        User receiver = User.builder().id(2L).build();
        User sender = User.builder().id(1L).build();
        FriendRequest request = FriendRequest.builder().id(10L).sender(sender).receiver(receiver).status("PENDING").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(receiver);
            when(friendRequestRepository.findById(10L)).thenReturn(Optional.of(request));

            friendService.acceptRequest(10L);

            verify(friendshipRepository, times(2)).save(any(Friendship.class));
            assertEquals("ACCEPTED", request.getStatus());
        }
    }

    @Test
    void acceptRequest_notReceiver_throws() {
        User otherUser = User.builder().id(3L).build();
        User sender = User.builder().id(1L).build();
        User receiver = User.builder().id(2L).build();
        FriendRequest request = FriendRequest.builder().id(10L).sender(sender).receiver(receiver).status("PENDING").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(otherUser);
            when(friendRequestRepository.findById(10L)).thenReturn(Optional.of(request));

            assertThrows(IllegalArgumentException.class, () -> friendService.acceptRequest(10L));
        }
    }

    @Test
    void sendRequest_alreadyFriends_throws() {
        User sender = User.builder().id(1L).build();
        User receiver = User.builder().id(2L).build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(sender);
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
            when(userBlockRepository.existsByBlockerIdAndBlockedId(2L, 1L)).thenReturn(false);
            when(friendshipRepository.existsByUserIdAndFriendId(1L, 2L)).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () -> friendService.sendRequest(2L));
        }
    }
}
