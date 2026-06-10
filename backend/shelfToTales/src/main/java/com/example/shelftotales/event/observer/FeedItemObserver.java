package com.example.shelftotales.event.observer;

import com.example.shelftotales.event.BookCompletedEvent;
import com.example.shelftotales.event.QuoteSharedEvent;
import com.example.shelftotales.exchange.domain.ExchangeCompletedEvent;
import com.example.shelftotales.event.ReviewPostedEvent;
import com.example.shelftotales.social.domain.ActivityFeedItem;
import com.example.shelftotales.social.infrastructure.ActivityFeedItemRepository;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.review.domain.Review;
import com.example.shelftotales.review.infrastructure.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Component
@RequiredArgsConstructor
public class FeedItemObserver {

    private final ActivityFeedItemRepository feedRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

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
        Review review = reviewRepository.findById(event.getReviewId()).orElse(null);
        String escapedBookTitle = event.getBookTitle() != null ? event.getBookTitle().replace("\"", "\\\"") : "";
        String comment = "";
        int rating = 0;
        boolean isSpoiler = false;
        
        if (review != null) {
            comment = review.getComment() != null ? review.getComment().replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "") : "";
            rating = review.getRating();
            isSpoiler = review.isSpoiler();
        }

        feedRepository.save(ActivityFeedItem.builder()
                .user(userRepository.getReferenceById(event.getActorId()))
                .activityType("POSTED_REVIEW")
                .referenceId(event.getReviewId())
                .referenceType("REVIEW")
                .metadata("{\"bookTitle\":\"" + escapedBookTitle + "\",\"reviewComment\":\"" + comment + "\",\"rating\":" + rating + ",\"isSpoiler\":" + isSpoiler + "}")
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

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onQuoteShared(QuoteSharedEvent event) {
        String escapedQuoteText = event.getQuoteText() != null ? event.getQuoteText().replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "") : "";
        String escapedBookTitle = event.getBookTitle() != null ? event.getBookTitle().replace("\"", "\\\"") : "";
        feedRepository.save(ActivityFeedItem.builder()
                .user(userRepository.getReferenceById(event.getActorId()))
                .activityType("SHARE_QUOTE")
                .referenceId(event.getQuoteId())
                .referenceType("QUOTE")
                .metadata("{\"bookTitle\":\"" + escapedBookTitle + "\",\"quoteText\":\"" + escapedQuoteText + "\",\"themeStyle\":\"" + event.getThemeStyle() + "\"}")
                .visibility("PUBLIC")
                .build());
    }
}
