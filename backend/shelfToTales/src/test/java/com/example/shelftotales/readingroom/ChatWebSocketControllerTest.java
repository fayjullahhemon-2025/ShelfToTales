package com.example.shelftotales.readingroom;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.readingroom.application.ReadingRoomService;
import com.example.shelftotales.readingroom.application.RoomMessageResponse;
import com.example.shelftotales.readingroom.presentation.ChatWebSocketController;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.security.Principal;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatWebSocketControllerTest {

    @Mock private ReadingRoomService readingRoomService;
    @Mock private UserRepository userRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ChatWebSocketController controller;

    @Test
    void handleChatMessage_persistsExactlyOnceAndBroadcasts() {
        User sender = User.builder().id(1L).email("alice@example.com").fullName("Alice").build();
        RoomMessageResponse resp = RoomMessageResponse.builder()
                .id(42L).roomId(7L).content("hi").sender(null).build();
        Principal principal = () -> "alice@example.com";

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(sender));
        when(readingRoomService.postMessage(eq(7L), eq("hi"), any(User.class))).thenReturn(resp);

        controller.handleChatMessage(7L, Map.of("content", "hi"), principal);

        verify(readingRoomService, times(1)).postMessage(7L, "hi", sender);
        verify(messagingTemplate, times(1)).convertAndSend("/topic/room/7", resp);
    }
}
