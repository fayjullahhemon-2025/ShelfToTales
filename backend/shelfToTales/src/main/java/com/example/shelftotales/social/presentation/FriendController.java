package com.example.shelftotales.social.presentation;
import com.example.shelftotales.social.application.*;
import com.example.shelftotales.social.infrastructure.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.social.application.FollowResponse;
import com.example.shelftotales.social.application.FriendRequestResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/social/friends")
@RequiredArgsConstructor
public class FriendController {
    private final FriendService friendService;

    @PostMapping("/request/{userId}")
    public ResponseEntity<Void> sendRequest(@PathVariable Long userId) {
        friendService.sendRequest(userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/request/{requestId}/accept")
    public ResponseEntity<Void> accept(@PathVariable Long requestId) {
        friendService.acceptRequest(requestId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/request/{requestId}")
    public ResponseEntity<Void> rejectOrCancel(@PathVariable Long requestId) {
        friendService.rejectRequest(requestId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Page<FollowResponse>> myFriends(Pageable pageable) {
        return ResponseEntity.ok(friendService.getFriends(pageable));
    }

    @GetMapping("/requests")
    public ResponseEntity<Page<FriendRequestResponse>> pendingRequests(Pageable pageable) {
        return ResponseEntity.ok(friendService.getPendingRequests(pageable));
    }
}
