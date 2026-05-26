package com.example.shelftotales.event;

import lombok.Getter;

@Getter
public class FriendshipCreatedEvent extends DomainEvent {
    private final Long friendId;

    public FriendshipCreatedEvent(Long actorId, Long friendId) {
        super(actorId);
        this.friendId = friendId;
    }
}
