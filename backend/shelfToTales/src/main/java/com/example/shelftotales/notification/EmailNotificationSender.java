package com.example.shelftotales.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class EmailNotificationSender implements NotificationSender {

    @Override
    public NotificationType getType() {
        return NotificationType.EMAIL;
    }

    @Override
    public void send(Notification notification) {
        log.warn("Email notification sent to {}: {} (email channel not configured)",
                notification.getRecipient(), notification.getSubject());
    }
}
