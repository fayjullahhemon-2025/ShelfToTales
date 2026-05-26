package com.example.shelftotales.event;

import lombok.Getter;
import java.time.LocalDateTime;

@Getter
public abstract class DomainEvent {
    private final Long actorId;
    private final LocalDateTime occurredAt;

    protected DomainEvent(Long actorId) {
        this.actorId = actorId;
        this.occurredAt = LocalDateTime.now();
    }
}
