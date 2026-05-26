package com.example.shelftotales.exchange.domain;

import com.example.shelftotales.event.DomainEvent;

import lombok.Getter;

@Getter
public class ExchangeCompletedEvent extends DomainEvent {
    private final Long requestId;
    private final Long listerId;
    private final Long requesterId;
    private final String listingType;

    public ExchangeCompletedEvent(Long actorId, Long requestId, Long listerId, Long requesterId, String listingType) {
        super(actorId);
        this.requestId = requestId;
        this.listerId = listerId;
        this.requesterId = requesterId;
        this.listingType = listingType;
    }
}
