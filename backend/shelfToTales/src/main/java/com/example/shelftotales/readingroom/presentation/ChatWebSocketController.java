package com.example.shelftotales.readingroom.presentation;

import com.example.shelftotales.readingroom.application.RoomMessageResponse;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.readingroom.application.ReadingRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ReadingRoomService readingRoomService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/{roomId}")
    public void handleChatMessage(@DestinationVariable Long roomId, Map<String, String> payload) {
        String content = payload.get("content");
        String senderEmail = payload.get("senderEmail");

        if (senderEmail == null || senderEmail.isBlank()) {
            throw new IllegalArgumentException("Sender email is required in WebSocket payload");
        }

        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found with email: " + senderEmail));

        RoomMessageResponse response = readingRoomService.postMessage(roomId, content, sender);

        // Broadcast to all clients subscribed to this room topic
        messagingTemplate.convertAndSend("/topic/room/" + roomId, response);
    }
}
