package com.example.shelftotales.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class PushNotificationSender implements NotificationSender {

    @Override
    public NotificationType getType() {
        return NotificationType.PUSH;
    }

    @Override
    public void send(Notification notification) {
        log.warn("Push notification sent to {}: {} (push channel not configured)",
                notification.getRecipient(), notification.getSubject());
    }
}
