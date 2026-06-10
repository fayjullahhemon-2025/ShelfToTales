package com.example.shelftotales.event;

import lombok.Getter;
import java.util.List;

@Getter
public class OrderConfirmedEvent extends DomainEvent {
    private final Long orderId;
    private final List<Long> bookIds;

    public OrderConfirmedEvent(Long actorId, Long orderId, List<Long> bookIds) {
        super(actorId);
        this.orderId = orderId;
        this.bookIds = bookIds;
    }
}
