package com.example.shelftotales.notification;

import lombok.Builder;
import lombok.Getter;

/**
 * Notification payload sent through any channel.
 */
@Getter
@Builder
public class Notification {
    private final String recipient;
    private final String subject;
    private final String message;
}
