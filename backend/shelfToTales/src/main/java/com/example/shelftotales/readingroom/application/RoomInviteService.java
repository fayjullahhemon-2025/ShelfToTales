package com.example.shelftotales.readingroom.application;

import com.example.shelftotales.readingroom.domain.*;
import com.example.shelftotales.readingroom.infrastructure.*;
import com.example.shelftotales.social.application.NotificationService;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomInviteService {
    private final RoomInviteRepository roomInviteRepository;
    private final ReadingRoomRepository readingRoomRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final RoomMemberService roomMemberService;

    @Transactional
    public void sendInvites(Long roomId, List<Long> userIds) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        ReadingRoom room = readingRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        if (!roomMemberService.isOwner(roomId, currentUser.getId()))
            throw new IllegalArgumentException("Only owner can send invites");
        for (Long userId : userIds) {
            User invitee = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
            if (roomInviteRepository.existsByRoomIdAndInviteeIdAndStatus(roomId, userId, "PENDING")) continue;
            roomInviteRepository.save(RoomInvite.builder().room(room).inviter(currentUser).invitee(invitee).build());
            roomMemberService.addMember(roomId, userId, "MEMBER");
            String actorName = currentUser.getFullName();
            if (actorName == null || actorName.isBlank()) actorName = currentUser.getEmail();
            notificationService.create(userId, currentUser.getId(), "ROOM_INVITE",
                    "ROOM", roomId, actorName + " invited you to " + room.getName());
        }
    }

    @Transactional(readOnly = true)
    public List<RoomInviteResponse> getPendingInvites(Long roomId) {
        return roomInviteRepository.findByRoomIdAndStatus(roomId, "PENDING").stream()
                .filter(i -> i.getCreatedAt() != null && i.getCreatedAt().plusDays(7).isAfter(LocalDateTime.now()))
                .map(this::toResponse).collect(Collectors.toList());
    }

    private RoomInviteResponse toResponse(RoomInvite invite) {
        return RoomInviteResponse.builder().id(invite.getId()).roomId(invite.getRoom().getId())
                .roomName(invite.getRoom().getName())
                .inviter(com.example.shelftotales.auth.application.UserSummaryResponse.builder()
                        .id(invite.getInviter().getId()).fullName(invite.getInviter().getFullName())
                        .profileImageUrl(invite.getInviter().getProfileImageUrl()).build())
                .invitee(com.example.shelftotales.auth.application.UserSummaryResponse.builder()
                        .id(invite.getInvitee().getId()).fullName(invite.getInvitee().getFullName())
                        .profileImageUrl(invite.getInvitee().getProfileImageUrl()).build())
                .status(invite.getStatus()).createdAt(invite.getCreatedAt()).build();
    }
}
