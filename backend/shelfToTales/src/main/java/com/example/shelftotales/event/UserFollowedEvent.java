package com.example.shelftotales.event;

import lombok.Getter;

@Getter
public class UserFollowedEvent extends DomainEvent {
    private final Long followedUserId;

    public UserFollowedEvent(Long actorId, Long followedUserId) {
        super(actorId);
        this.followedUserId = followedUserId;
    }
}
