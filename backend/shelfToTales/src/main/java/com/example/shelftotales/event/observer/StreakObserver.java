package com.example.shelftotales.event.observer;

import com.example.shelftotales.event.BookCompletedEvent;
import com.example.shelftotales.gamification.application.StreakService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Component
@RequiredArgsConstructor
public class StreakObserver {
    private final StreakService streakService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookCompleted(BookCompletedEvent event) {
        streakService.recordActivity(event.getActorId());
    }
}
