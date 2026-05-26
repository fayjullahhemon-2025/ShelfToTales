package com.example.shelftotales.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class InAppNotificationSender implements NotificationSender {

    @Override
    public NotificationType getType() {
        return NotificationType.IN_APP;
    }

    @Override
    public void send(Notification notification) {
        log.info("IN_APP → [{}] '{}'", notification.getRecipient(), notification.getMessage());
        // TODO: persist to notifications table or push via WebSocket
    }
}
