package com.example.shelftotales.event.observer;

import com.example.shelftotales.event.UserFollowedEvent;
import com.example.shelftotales.event.FriendshipCreatedEvent;
import com.example.shelftotales.social.application.NotificationService;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Component
@RequiredArgsConstructor
public class NotificationObserver {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onUserFollowed(UserFollowedEvent event) {
        String actorName = userRepository.findById(event.getActorId())
                .map(u -> u.getFullName()).orElse("Someone");
        notificationService.create(event.getFollowedUserId(), event.getActorId(),
                "NEW_FOLLOWER", "USER", event.getActorId(),
                actorName + " started following you");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onFriendshipCreated(FriendshipCreatedEvent event) {
        String actorName = userRepository.findById(event.getActorId())
                .map(u -> u.getFullName()).orElse("Someone");
        notificationService.create(event.getFriendId(), event.getActorId(),
                "FRIEND_ACCEPTED", "USER", event.getActorId(),
                actorName + " accepted your friend request");
    }
}
