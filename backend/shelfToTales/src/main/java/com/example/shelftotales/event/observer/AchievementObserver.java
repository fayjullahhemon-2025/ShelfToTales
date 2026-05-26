package com.example.shelftotales.event.observer;

import com.example.shelftotales.event.*;
import com.example.shelftotales.gamification.domain.Achievement;
import com.example.shelftotales.gamification.application.AchievementService;
import com.example.shelftotales.social.application.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

import java.util.List;

@Component
@RequiredArgsConstructor
public class AchievementObserver {
    private final AchievementService achievementService;
    private final NotificationService notificationService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookCompleted(BookCompletedEvent event) { check(event.getActorId()); }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onReviewPosted(ReviewPostedEvent event) { check(event.getActorId()); }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onUserFollowed(UserFollowedEvent event) { check(event.getFollowedUserId()); }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onFriendshipCreated(FriendshipCreatedEvent event) {
        check(event.getActorId());
        check(event.getFriendId());
    }

    private void check(Long userId) {
        List<Achievement> earned = achievementService.evaluateAndAward(userId);
        for (Achievement a : earned) {
            notificationService.create(userId, null, "ACHIEVEMENT_EARNED",
                    "ACHIEVEMENT", a.getId(), "You earned: " + a.getName() + "!");
        }
    }
}
