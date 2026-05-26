package com.example.shelftotales.admin.application;
import com.example.shelftotales.admin.domain.*;
import com.example.shelftotales.admin.infrastructure.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final UserWarningRepository warningRepository;

    @Transactional(readOnly = true)
    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Transactional
    public void banUser(Long userId, String reason) {
        User admin = AuthUtils.getCurrentUser(userRepository);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (user.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Cannot ban an admin");
        }

        user.setBanned(true);
        user.setBannedAt(LocalDateTime.now());
        user.setBanReason(reason);
        userRepository.save(user);
    }

    @Transactional
    public void unbanUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setBanned(false);
        user.setBannedAt(null);
        user.setBanReason(null);
        userRepository.save(user);
    }

    @Transactional
    public void warnUser(Long userId, String reason) {
        User admin = AuthUtils.getCurrentUser(userRepository);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        warningRepository.save(UserWarning.builder().user(user).admin(admin).reason(reason).build());
    }

    @Transactional(readOnly = true)
    public List<UserWarning> getWarnings(Long userId) {
        return warningRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void changeRole(Long userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setRole(newRole);
        userRepository.save(user);
    }
}
