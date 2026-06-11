package com.example.shelftotales.event.observer;

import com.example.shelftotales.event.*;
import com.example.shelftotales.gamification.domain.Achievement;
import com.example.shelftotales.gamification.application.AchievementService;
import com.example.shelftotales.social.application.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.*;

public class AchievementObserverTest {

    @Mock
    private AchievementService achievementService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AchievementObserver achievementObserver;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void onBookCompleted_ShouldAwardAchievementAndSendNotification() {
        Long userId = 1L;
        Long bookId = 2L;
        Achievement ach = Achievement.builder().id(10L).name("First Book").build();

        when(achievementService.evaluateAndAward(userId)).thenReturn(List.of(ach));

        achievementObserver.onBookCompleted(new BookCompletedEvent(userId, bookId, "My Book", null, null));

        verify(achievementService).evaluateAndAward(userId);
        verify(notificationService).create(userId, null, "ACHIEVEMENT_EARNED", "ACHIEVEMENT", 10L, "You earned: First Book!");
    }

    @Test
    public void onReviewPosted_ShouldAwardAchievementAndSendNotification() {
        Long userId = 1L;
        Long reviewId = 2L;
        Long bookId = 3L;
        Achievement ach = Achievement.builder().id(11L).name("First Review").build();

        when(achievementService.evaluateAndAward(userId)).thenReturn(List.of(ach));

        achievementObserver.onReviewPosted(new ReviewPostedEvent(userId, reviewId, bookId, "My Book"));

        verify(achievementService).evaluateAndAward(userId);
        verify(notificationService).create(userId, null, "ACHIEVEMENT_EARNED", "ACHIEVEMENT", 11L, "You earned: First Review!");
    }

    @Test
    public void onUserFollowed_ShouldAwardAchievementAndSendNotification() {
        Long actorId = 1L;
        Long followedUserId = 2L;
        Achievement ach = Achievement.builder().id(12L).name("First Follower").build();

        when(achievementService.evaluateAndAward(followedUserId)).thenReturn(List.of(ach));

        achievementObserver.onUserFollowed(new UserFollowedEvent(actorId, followedUserId));

        verify(achievementService).evaluateAndAward(followedUserId);
        verify(notificationService).create(followedUserId, null, "ACHIEVEMENT_EARNED", "ACHIEVEMENT", 12L, "You earned: First Follower!");
    }

    @Test
    public void onFriendshipCreated_ShouldCheckBothUsers() {
        Long user1 = 1L;
        Long user2 = 2L;

        when(achievementService.evaluateAndAward(anyLong())).thenReturn(Collections.emptyList());

        achievementObserver.onFriendshipCreated(new FriendshipCreatedEvent(user1, user2));

        verify(achievementService).evaluateAndAward(user1);
        verify(achievementService).evaluateAndAward(user2);
        verifyNoInteractions(notificationService);
    }
}
