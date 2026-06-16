package com.example.shelftotales.readingroom.presentation;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.readingroom.application.RoomMemberService;
import com.example.shelftotales.readingroom.application.RoomPlayerState;
import com.example.shelftotales.readingroom.application.RoomPlayerStateRegistry;
import com.example.shelftotales.readingroom.infrastructure.RoomPlaylistSongRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class RoomMusicWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final RoomMemberService roomMemberService;
    private final RoomPlayerStateRegistry registry;
    private final RoomPlaylistSongRepository roomPlaylistSongRepository;

    @MessageMapping("/room/{roomId}/music/play")
    public void play(@DestinationVariable Long roomId, Map<String, Object> payload, Principal principal) {
        assertMember(roomId, principal);
        Long trackId = asLong(payload.get("trackId"));
        long positionMs = asLong(payload.get("positionMs"));
        RoomPlayerState state = new RoomPlayerState(trackId, positionMs, true, System.currentTimeMillis(), principal.getName());
        registry.update(roomId, state);
        broadcast(roomId, "play", state);
    }

    @MessageMapping("/room/{roomId}/music/pause")
    public void pause(@DestinationVariable Long roomId, Map<String, Object> payload, Principal principal) {
        assertMember(roomId, principal);
        long positionMs = asLong(payload.get("positionMs"));
        Long trackId = payload.get("trackId") == null ? null : asLong(payload.get("trackId"));
        RoomPlayerState state = new RoomPlayerState(trackId, positionMs, false, System.currentTimeMillis(), principal.getName());
        registry.update(roomId, state);
        broadcast(roomId, "pause", state);
    }

    @MessageMapping("/room/{roomId}/music/seek")
    public void seek(@DestinationVariable Long roomId, Map<String, Object> payload, Principal principal) {
        assertMember(roomId, principal);
        long positionMs = asLong(payload.get("positionMs"));
        RoomPlayerState prev = registry.get(roomId);
        boolean playing = prev != null && prev.playing();
        Long trackId = prev != null ? prev.currentTrackId() : null;
        RoomPlayerState state = new RoomPlayerState(trackId, positionMs, playing, System.currentTimeMillis(), principal.getName());
        registry.update(roomId, state);
        broadcast(roomId, "seek", state);
    }

    @MessageMapping("/room/{roomId}/music/track")
    public void track(@DestinationVariable Long roomId, Map<String, Object> payload, Principal principal) {
        assertMember(roomId, principal);
        Long trackId = asLong(payload.get("trackId"));
        if (trackId == null) {
            throw new IllegalArgumentException("trackId is required");
        }
        boolean belongs = roomPlaylistSongRepository.findById(trackId)
                .map(s -> s.getRoom() != null && roomId.equals(s.getRoom().getId()))
                .orElse(false);
        if (!belongs) {
            throw new IllegalArgumentException("Track does not belong to this room");
        }
        RoomPlayerState state = new RoomPlayerState(trackId, 0L, true, System.currentTimeMillis(), principal.getName());
        registry.update(roomId, state);
        broadcast(roomId, "track", state);
    }

    private void assertMember(Long roomId, Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalArgumentException("User principal is required");
        }
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + principal.getName()));
        if (!roomMemberService.isMember(roomId, user.getId())) {
            throw new IllegalArgumentException("Not a member of this room");
        }
    }

    private void broadcast(Long roomId, String action, RoomPlayerState state) {
        Map<String, Object> payload = Map.of(
                "action", action,
                "trackId", state.currentTrackId() == null ? -1L : state.currentTrackId(),
                "positionMs", state.positionMs(),
                "playing", state.playing(),
                "senderEmail", state.senderEmail() == null ? "" : state.senderEmail(),
                "ts", state.ts()
        );
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/music", payload);
    }

    private static Long asLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(o.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
