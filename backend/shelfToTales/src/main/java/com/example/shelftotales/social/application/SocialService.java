package com.example.shelftotales.social.application;
import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.social.infrastructure.*;

import com.example.shelftotales.social.application.SocialActivityResponse;
import com.example.shelftotales.auth.application.UserSummaryResponse;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SocialService {

    private final UserRepository userRepository;
    private final SocialActivityRepository socialActivityRepository;

    @Transactional
    public void followUser(Long targetUserId) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        if (currentUser.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUserId));

        if (currentUser.getFollowing().contains(targetUser)) {
            return; // Already following
        }

        currentUser.getFollowing().add(targetUser);
        userRepository.save(currentUser);

        // Log Social Activity
        String name = currentUser.getFullName();
        if (name == null || name.isBlank()) name = currentUser.getEmail();
        String targetName = targetUser.getFullName();
        if (targetName == null || targetName.isBlank()) targetName = targetUser.getEmail();

        socialActivityRepository.save(SocialActivity.builder()
                .user(currentUser)
                .type("FOLLOW")
                .referenceId(targetUserId)
                .content(name + " followed " + targetName)
                .build());
    }

    @Transactional
    public void unfollowUser(Long targetUserId) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUserId));

        if (!currentUser.getFollowing().contains(targetUser)) {
            return; // Not following
        }

        currentUser.getFollowing().remove(targetUser);
        userRepository.save(currentUser);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getFollowers(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        User currentUser = AuthUtils.getCurrentUser(userRepository);

        return user.getFollowers().stream()
                .map(follower -> mapToUserSummaryResponse(follower, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getFollowing(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        User currentUser = AuthUtils.getCurrentUser(userRepository);

        return user.getFollowing().stream()
                .map(following -> mapToUserSummaryResponse(following, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> searchUsers(String query) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        if (query == null || query.isBlank()) {
            return Collections.emptyList();
        }

        List<User> matches = userRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query);
        return matches.stream()
                .filter(u -> !u.getId().equals(currentUser.getId())) // Exclude current user
                .map(u -> mapToUserSummaryResponse(u, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SocialActivityResponse> getActivityFeed() {
        User currentUser = AuthUtils.getCurrentUser(userRepository);

        // Feed includes user's own activities and their followings' activities
        Set<User> feedUsers = new HashSet<>(currentUser.getFollowing());
        feedUsers.add(currentUser);

        List<SocialActivity> activities = socialActivityRepository.findByUserInOrderByCreatedAtDesc(feedUsers);

        return activities.stream()
                .map(activity -> SocialActivityResponse.builder()
                        .id(activity.getId())
                        .type(activity.getType())
                        .referenceId(activity.getReferenceId())
                        .content(activity.getContent())
                        .createdAt(activity.getCreatedAt())
                        .user(mapToUserSummaryResponse(activity.getUser(), currentUser))
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void logCustomActivity(User user, String type, Long referenceId, String content) {
        socialActivityRepository.save(SocialActivity.builder()
                .user(user)
                .type(type)
                .referenceId(referenceId)
                .content(content)
                .build());
    }

    private UserSummaryResponse mapToUserSummaryResponse(User user, User currentUser) {
        String name = user.getFullName();
        if (name == null || name.isBlank()) {
            name = user.getEmail();
        }

        return UserSummaryResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(name)
                .profileImageUrl(user.getProfileImageUrl())
                .isFollowing(currentUser.getFollowing().contains(user))
                .build();
    }
}
