package com.example.shelftotales.readingroom.presentation;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.readingroom.application.PlaylistSongRequest;
import com.example.shelftotales.readingroom.application.RoomPlaylistService;
import com.example.shelftotales.readingroom.application.RoomPlaylistSongResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms/{roomId}/playlist")
@RequiredArgsConstructor
public class RoomPlaylistController {

    private final RoomPlaylistService roomPlaylistService;

    @GetMapping("/songs")
    public ResponseEntity<List<RoomPlaylistSongResponse>> list(
            @PathVariable Long roomId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(roomPlaylistService.listSongs(roomId, user));
    }

    @PostMapping(value = "/songs", consumes = "multipart/form-data")
    public ResponseEntity<RoomPlaylistSongResponse> addSong(
            @PathVariable Long roomId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "artist", required = false) String artist,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(roomPlaylistService.addSong(roomId, file, title, artist, sortOrder, user));
    }

    @PutMapping("/songs/{songId}")
    public ResponseEntity<RoomPlaylistSongResponse> updateSong(
            @PathVariable Long roomId,
            @PathVariable Long songId,
            @RequestBody PlaylistSongRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(roomPlaylistService.updateSong(roomId, songId, request, user));
    }

    @DeleteMapping("/songs/{songId}")
    public ResponseEntity<Map<String, String>> deleteSong(
            @PathVariable Long roomId,
            @PathVariable Long songId,
            @AuthenticationPrincipal User user) {
        roomPlaylistService.deleteSong(roomId, songId, user);
        return ResponseEntity.ok(Map.of("message", "Song deleted"));
    }
}
