package com.example.shelftotales.readingroom.presentation;

import com.example.shelftotales.shared.dto.*;
import com.example.shelftotales.auth.application.*;
import com.example.shelftotales.catalog.application.*;
import com.example.shelftotales.bookshelf.application.*;
import com.example.shelftotales.commerce.application.*;
import com.example.shelftotales.social.application.*;
import com.example.shelftotales.readingroom.application.*;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.readingroom.application.ReadingRoomService;
import com.example.shelftotales.shared.util.AuthUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class ReadingRoomController {

    private final ReadingRoomService readingRoomService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ReadingRoomResponse> createRoom(@Valid @RequestBody ReadingRoomRequest request) {
        return ResponseEntity.ok(readingRoomService.createRoom(request));
    }

    @GetMapping
    public ResponseEntity<List<ReadingRoomResponse>> getRooms() {
        return ResponseEntity.ok(readingRoomService.getRooms());
    }

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<RoomMessageResponse>> getMessages(@PathVariable Long roomId) {
        return ResponseEntity.ok(readingRoomService.getMessages(roomId));
    }

    @PostMapping("/{roomId}/messages")
    public ResponseEntity<RoomMessageResponse> postMessage(
            @PathVariable Long roomId,
            @RequestBody Map<String, String> body) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        return ResponseEntity.ok(readingRoomService.postMessage(roomId, body.get("content"), currentUser));
    }
}
