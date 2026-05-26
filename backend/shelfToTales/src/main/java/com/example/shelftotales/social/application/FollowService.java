package com.example.shelftotales.social.application;
import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.social.infrastructure.*;

import com.example.shelftotales.social.application.FollowResponse;
import com.example.shelftotales.event.UserFollowedEvent;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final UserBlockRepository userBlockRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void follow(Long targetUserId) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        if (currentUser.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("Cannot follow yourself");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUserId));

        if (userBlockRepository.existsByBlockerIdAndBlockedId(targetUserId, currentUser.getId())) {
            throw new IllegalArgumentException("Cannot follow this user");
        }

        if (followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), targetUserId)) {
            return;
        }

        followRepository.save(Follow.builder().follower(currentUser).following(target).build());
        eventPublisher.publishEvent(new UserFollowedEvent(currentUser.getId(), targetUserId));
    }

    @Transactional
    public void unfollow(Long targetUserId) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        followRepository.findByFollowerIdAndFollowingId(currentUser.getId(), targetUserId)
                .ifPresent(followRepository::delete);
    }

    @Transactional(readOnly = true)
    public Page<FollowResponse> getFollowers(Long userId, Pageable pageable) {
        return followRepository.findByFollowingId(userId, pageable)
                .map(f -> toResponse(f.getFollower(), userId));
    }

    @Transactional(readOnly = true)
    public Page<FollowResponse> getFollowing(Long userId, Pageable pageable) {
        return followRepository.findByFollowerId(userId, pageable)
                .map(f -> toResponse(f.getFollowing(), userId));
    }

    private FollowResponse toResponse(User user, Long perspectiveUserId) {
        return FollowResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .profileImageUrl(user.getProfileImageUrl())
                .isFollowingBack(followRepository.existsByFollowerIdAndFollowingId(user.getId(), perspectiveUserId))
                .build();
    }
}
