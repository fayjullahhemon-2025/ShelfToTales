package com.example.shelftotales.social.application;
import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.social.infrastructure.*;

import com.example.shelftotales.social.application.FollowResponse;
import com.example.shelftotales.social.application.FriendRequestResponse;
import com.example.shelftotales.event.FriendshipCreatedEvent;
import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.auth.infrastructure.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.bookshelf.infrastructure.*;
import com.example.shelftotales.wishlist.infrastructure.*;
import com.example.shelftotales.review.infrastructure.*;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserBlockRepository userBlockRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void sendRequest(Long targetUserId) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        if (currentUser.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("Cannot send friend request to yourself");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUserId));

        if (userBlockRepository.existsByBlockerIdAndBlockedId(targetUserId, currentUser.getId())) {
            throw new IllegalArgumentException("Cannot send request to this user");
        }
        if (friendshipRepository.existsByUserIdAndFriendId(currentUser.getId(), targetUserId)) {
            throw new IllegalArgumentException("Already friends");
        }
        if (friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(currentUser.getId(), targetUserId, "PENDING")) {
            throw new IllegalArgumentException("Request already pending");
        }

        friendRequestRepository.save(FriendRequest.builder().sender(currentUser).receiver(target).build());
    }

    @Transactional
    public void acceptRequest(Long requestId) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (!request.getReceiver().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Not authorized to accept this request");
        }
        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalArgumentException("Request is not pending");
        }

        request.setStatus("ACCEPTED");
        friendRequestRepository.save(request);

        friendshipRepository.save(Friendship.builder().user(request.getSender()).friend(request.getReceiver()).build());
        friendshipRepository.save(Friendship.builder().user(request.getReceiver()).friend(request.getSender()).build());

        eventPublisher.publishEvent(new FriendshipCreatedEvent(
                request.getReceiver().getId(), request.getSender().getId()));
    }

    @Transactional
    public void rejectRequest(Long requestId) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (!request.getReceiver().getId().equals(currentUser.getId())
                && !request.getSender().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Not authorized");
        }

        request.setStatus("REJECTED");
        friendRequestRepository.save(request);
    }

    @Transactional(readOnly = true)
    public Page<FollowResponse> getFriends(Pageable pageable) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        return friendshipRepository.findByUserId(currentUser.getId(), pageable)
                .map(f -> FollowResponse.builder()
                        .userId(f.getFriend().getId())
                        .fullName(f.getFriend().getFullName())
                        .profileImageUrl(f.getFriend().getProfileImageUrl())
                        .build());
    }

    @Transactional(readOnly = true)
    public Page<FriendRequestResponse> getPendingRequests(Pageable pageable) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        return friendRequestRepository.findByReceiverIdAndStatus(currentUser.getId(), "PENDING", pageable)
                .map(r -> FriendRequestResponse.builder()
                        .requestId(r.getId())
                        .userId(r.getSender().getId())
                        .fullName(r.getSender().getFullName())
                        .profileImageUrl(r.getSender().getProfileImageUrl())
                        .status(r.getStatus())
                        .createdAt(r.getCreatedAt())
                        .build());
    }

    @Transactional(readOnly = true)
    public String getFriendStatus(Long targetUserId) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        if (friendshipRepository.existsByUserIdAndFriendId(currentUser.getId(), targetUserId)) return "FRIENDS";
        if (friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(currentUser.getId(), targetUserId, "PENDING")) return "REQUEST_SENT";
        if (friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(targetUserId, currentUser.getId(), "PENDING")) return "REQUEST_RECEIVED";
        return "NONE";
    }

    @Transactional
    public void unfriend(Long friendId) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        if (!friendshipRepository.existsByUserIdAndFriendId(currentUser.getId(), friendId))
            throw new IllegalArgumentException("Not friends with this user");
        friendshipRepository.deleteByUserIdAndFriendId(currentUser.getId(), friendId);
        friendshipRepository.deleteByUserIdAndFriendId(friendId, currentUser.getId());
    }
}
