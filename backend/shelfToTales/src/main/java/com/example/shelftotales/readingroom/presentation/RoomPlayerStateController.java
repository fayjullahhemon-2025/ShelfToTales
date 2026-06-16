package com.example.shelftotales.readingroom.presentation;

import com.example.shelftotales.readingroom.application.RoomPlayerState;
import com.example.shelftotales.readingroom.application.RoomPlayerStateRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rooms/{roomId}/player-state")
@RequiredArgsConstructor
public class RoomPlayerStateController {

    private final RoomPlayerStateRegistry registry;

    @GetMapping
    public ResponseEntity<RoomPlayerState> get(@PathVariable Long roomId) {
        RoomPlayerState state = registry.get(roomId);
        if (state == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(state);
    }
}
