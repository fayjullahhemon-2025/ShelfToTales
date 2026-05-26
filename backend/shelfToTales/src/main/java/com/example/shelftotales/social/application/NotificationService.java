package com.example.shelftotales.social.application;
import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.social.infrastructure.*;

import com.example.shelftotales.social.application.NotificationResponse;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final UserNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void create(Long recipientId, Long actorId, String type,
                       String referenceType, Long referenceId, String message) {
        User recipient = userRepository.getReferenceById(recipientId);
        User actor = actorId != null ? userRepository.getReferenceById(actorId) : null;

        UserNotification notification = UserNotification.builder()
                .user(recipient).actor(actor).type(type)
                .referenceType(referenceType).referenceId(referenceId)
                .message(message).build();
        notificationRepository.save(notification);

        messagingTemplate.convertAndSend("/topic/notifications/" + recipientId, toResponse(notification));
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(Pageable pageable) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId(), pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        return notificationRepository.countByUserIdAndReadFalse(currentUser.getId());
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        UserNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllRead() {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        notificationRepository.markAllRead(currentUser.getId());
    }

    private NotificationResponse toResponse(UserNotification n) {
        return NotificationResponse.builder()
                .id(n.getId()).type(n.getType())
                .actorId(n.getActor() != null ? n.getActor().getId() : null)
                .actorName(n.getActor() != null ? n.getActor().getFullName() : null)
                .actorAvatar(n.getActor() != null ? n.getActor().getProfileImageUrl() : null)
                .referenceType(n.getReferenceType()).referenceId(n.getReferenceId())
                .message(n.getMessage()).read(n.isRead()).createdAt(n.getCreatedAt())
                .build();
    }
}
