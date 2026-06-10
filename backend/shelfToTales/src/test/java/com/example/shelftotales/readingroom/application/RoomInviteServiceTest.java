package com.example.shelftotales.readingroom.application;

import com.example.shelftotales.readingroom.domain.*;
import com.example.shelftotales.readingroom.infrastructure.*;
import com.example.shelftotales.social.application.NotificationService;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoomInviteServiceTest {
    @Mock private RoomInviteRepository roomInviteRepository;
    @Mock private ReadingRoomRepository readingRoomRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;
    @Mock private RoomMemberService roomMemberService;
    @InjectMocks private RoomInviteService roomInviteService;

    @Test
    void sendInvites_skipsDuplicatePending() {
        User mockUser = User.builder().id(10L).email("test@test.com").fullName("Test User").build();
        User invitee = User.builder().id(2L).email("invitee@test.com").fullName("Invitee").build();
        ReadingRoom mockRoom = ReadingRoom.builder().id(1L).name("Test Room").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(mockUser);
            when(roomMemberService.isOwner(1L, 10L)).thenReturn(true);
            when(readingRoomRepository.findById(1L)).thenReturn(Optional.of(mockRoom));
            when(userRepository.findById(2L)).thenReturn(Optional.of(invitee));
            when(roomInviteRepository.existsByRoomIdAndInviteeIdAndStatus(1L, 2L, "PENDING")).thenReturn(true);

            roomInviteService.sendInvites(1L, java.util.List.of(2L));

            verify(roomInviteRepository, never()).save(any());
        }
    }
}
