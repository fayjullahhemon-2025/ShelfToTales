package com.example.shelftotales.notification;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Factory pattern: resolves the correct NotificationSender by type.
 * New channels can be added by implementing NotificationSender — no modification needed here.
 */
@Component
public class NotificationFactory {

    private final Map<NotificationType, NotificationSender> senders;

    public NotificationFactory(List<NotificationSender> senderList) {
        this.senders = senderList.stream()
                .collect(Collectors.toMap(NotificationSender::getType, Function.identity()));
    }

    /**
     * Get sender for a given notification type.
     */
    public NotificationSender getSender(NotificationType type) {
        NotificationSender sender = senders.get(type);
        if (sender == null) {
            throw new IllegalArgumentException("No sender registered for type: " + type);
        }
        return sender;
    }

    /**
     * Convenience: send notification through specified channel.
     */
    public void send(NotificationType type, Notification notification) {
        getSender(type).send(notification);
    }
}
