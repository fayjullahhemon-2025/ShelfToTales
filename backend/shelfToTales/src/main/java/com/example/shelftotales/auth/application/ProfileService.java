package com.example.shelftotales.auth.application;

import com.example.shelftotales.auth.application.ProfileRequest;
import com.example.shelftotales.auth.application.ProfileResponse;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "profiles", key = "T(com.example.shelftotales.util.AuthUtils).getCurrentUserEmail()")
    public ProfileResponse getProfile() {
        return toResponse(AuthUtils.getCurrentUser(userRepository));
    }

    @Transactional
    @CacheEvict(value = "profiles", key = "T(com.example.shelftotales.util.AuthUtils).getCurrentUserEmail()")
    public ProfileResponse updateProfile(ProfileRequest request) {
        User user = AuthUtils.getCurrentUser(userRepository);
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
            user.setNameOverridden(true);
        }
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getProfileImageUrl() != null) user.setProfileImageUrl(request.getProfileImageUrl());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        if (request.getHobbies() != null) user.setHobbies(request.getHobbies());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());
        user.setUpdatedAt(LocalDateTime.now());
        return toResponse(userRepository.save(user));
    }

    private ProfileResponse toResponse(User user) {
        return ProfileResponse.builder()
                .id(user.getId()).email(user.getEmail())
                .fullName(user.getFullName()).bio(user.getBio())
                .profileImageUrl(user.getProfileImageUrl())
                .phone(user.getPhone()).address(user.getAddress())
                .hobbies(user.getHobbies()).dateOfBirth(user.getDateOfBirth())
                .createdAt(user.getCreatedAt()).updatedAt(user.getUpdatedAt())
                .build();
    }
}
