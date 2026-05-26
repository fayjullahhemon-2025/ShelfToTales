package com.example.shelftotales.event.observer;

import com.example.shelftotales.event.BookCompletedEvent;
import com.example.shelftotales.exchange.domain.ExchangeCompletedEvent;
import com.example.shelftotales.event.ReviewPostedEvent;
import com.example.shelftotales.social.domain.ActivityFeedItem;
import com.example.shelftotales.social.infrastructure.ActivityFeedItemRepository;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Component
@RequiredArgsConstructor
public class FeedItemObserver {

    private final ActivityFeedItemRepository feedRepository;
    private final UserRepository userRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookCompleted(BookCompletedEvent event) {
        feedRepository.save(ActivityFeedItem.builder()
                .user(userRepository.getReferenceById(event.getActorId()))
                .activityType("FINISHED_BOOK")
                .referenceId(event.getBookId())
                .referenceType("BOOK")
                .metadata("{\"bookTitle\":\"" + event.getBookTitle() + "\"}")
                .visibility("PUBLIC")
                .build());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onReviewPosted(ReviewPostedEvent event) {
        feedRepository.save(ActivityFeedItem.builder()
                .user(userRepository.getReferenceById(event.getActorId()))
                .activityType("POSTED_REVIEW")
                .referenceId(event.getReviewId())
                .referenceType("REVIEW")
                .metadata("{\"bookTitle\":\"" + event.getBookTitle() + "\"}")
                .visibility("PUBLIC")
                .build());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onExchangeCompleted(ExchangeCompletedEvent event) {
        feedRepository.save(ActivityFeedItem.builder()
                .user(userRepository.getReferenceById(event.getActorId()))
                .activityType("EXCHANGE_COMPLETED")
                .referenceId(event.getRequestId())
                .referenceType("EXCHANGE")
                .metadata("{\"type\":\"" + event.getListingType() + "\"}")
                .visibility("PUBLIC")
                .build());
    }
}
