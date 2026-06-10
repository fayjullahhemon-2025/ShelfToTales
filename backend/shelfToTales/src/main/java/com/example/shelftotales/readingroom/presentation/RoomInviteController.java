package com.example.shelftotales.readingroom.presentation;

import com.example.shelftotales.readingroom.application.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomInviteController {
    private final RoomMemberService roomMemberService;
    private final RoomInviteService roomInviteService;

    @GetMapping("/{roomId}/members")
    public ResponseEntity<List<RoomMemberResponse>> getMembers(@PathVariable Long roomId) {
        return ResponseEntity.ok(roomMemberService.getMembers(roomId));
    }

    @DeleteMapping("/{roomId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long roomId, @PathVariable Long userId) {
        roomMemberService.removeMember(roomId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{roomId}/invites")
    public ResponseEntity<Void> sendInvites(@PathVariable Long roomId, @RequestBody Map<String, List<Long>> body) {
        roomInviteService.sendInvites(roomId, body.get("userIds"));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{roomId}/invites")
    public ResponseEntity<List<RoomInviteResponse>> getInvites(@PathVariable Long roomId) {
        return ResponseEntity.ok(roomInviteService.getPendingInvites(roomId));
    }
}
