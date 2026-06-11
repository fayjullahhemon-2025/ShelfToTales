package com.example.shelftotales.notification;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class NotificationFactoryTest {

    @Mock
    private NotificationSender emailSender;

    @Mock
    private NotificationSender pushSender;

    private NotificationFactory factory;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        when(emailSender.getType()).thenReturn(NotificationType.EMAIL);
        when(pushSender.getType()).thenReturn(NotificationType.PUSH);
        factory = new NotificationFactory(List.of(emailSender, pushSender));
    }

    @Test
    public void getSender_ShouldResolveCorrectSender() {
        NotificationSender sender = factory.getSender(NotificationType.EMAIL);
        assertEquals(emailSender, sender);
    }

    @Test
    public void getSender_ShouldThrowExceptionForUnregisteredType() {
        assertThrows(IllegalArgumentException.class, () -> {
            factory.getSender(NotificationType.IN_APP);
        });
    }

    @Test
    public void send_ShouldDelegateToSender() {
        Notification notification = Notification.builder()
                .recipient("test@example.com")
                .subject("Hello")
                .message("Test message")
                .build();
        factory.send(NotificationType.PUSH, notification);
        verify(pushSender).send(notification);
    }
}
