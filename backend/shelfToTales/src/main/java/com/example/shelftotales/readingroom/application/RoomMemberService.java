package com.example.shelftotales.readingroom.application;

import com.example.shelftotales.readingroom.domain.*;
import com.example.shelftotales.readingroom.infrastructure.*;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomMemberService {
    private final RoomMemberRepository roomMemberRepository;
    private final ReadingRoomRepository readingRoomRepository;
    private final UserRepository userRepository;

    @Transactional
    public void addMember(Long roomId, Long userId, String role) {
        if (roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) return;
        ReadingRoom room = readingRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        roomMemberRepository.save(RoomMember.builder().room(room).user(user).role(role).build());
    }

    @Transactional
    public void joinRoom(Long roomId) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        ReadingRoom room = readingRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        if (!"PUBLIC".equalsIgnoreCase(room.getVisibility())) {
            throw new IllegalArgumentException("Cannot join a private room without an invite");
        }
        addMember(roomId, currentUser.getId(), "MEMBER");
    }

    @Transactional
    public void removeMember(Long roomId, Long userId) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        RoomMember ownerMember = roomMemberRepository.findByRoomIdAndUserId(roomId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Not a member"));
        if (!"OWNER".equals(ownerMember.getRole()))
            throw new IllegalArgumentException("Only owner can remove members");
        if (userId.equals(currentUser.getId()))
            throw new IllegalArgumentException("Owner cannot remove themselves");
        roomMemberRepository.deleteByRoomIdAndUserId(roomId, userId);
    }

    @Transactional(readOnly = true)
    public List<RoomMemberResponse> getMembers(Long roomId) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, currentUser.getId()))
            throw new IllegalArgumentException("Not a member of this room");
        return roomMemberRepository.findByRoomId(roomId).stream()
                .map(m -> RoomMemberResponse.builder()
                        .id(m.getId())
                        .user(com.example.shelftotales.auth.application.UserSummaryResponse.builder()
                                .id(m.getUser().getId()).fullName(m.getUser().getFullName())
                                .profileImageUrl(m.getUser().getProfileImageUrl()).build())
                        .role(m.getRole()).joinedAt(m.getJoinedAt()).build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isMember(Long roomId, Long userId) {
        return roomMemberRepository.existsByRoomIdAndUserId(roomId, userId);
    }

    @Transactional(readOnly = true)
    public boolean isOwner(Long roomId, Long userId) {
        return roomMemberRepository.findByRoomIdAndUserId(roomId, userId)
                .map(m -> "OWNER".equals(m.getRole())).orElse(false);
    }
}
