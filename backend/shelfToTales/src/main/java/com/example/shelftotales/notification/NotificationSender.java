package com.example.shelftotales.notification;

/**
 * Factory pattern: common interface for all notification senders.
 */
public interface NotificationSender {

    /**
     * @return the type this sender handles
     */
    NotificationType getType();

    /**
     * Send a notification.
     */
    void send(Notification notification);
}
