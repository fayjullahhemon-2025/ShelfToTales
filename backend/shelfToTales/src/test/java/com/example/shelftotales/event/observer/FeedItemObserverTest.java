package com.example.shelftotales.event.observer;

import com.example.shelftotales.event.BookCompletedEvent;
import com.example.shelftotales.event.QuoteSharedEvent;
import com.example.shelftotales.event.ReviewPostedEvent;
import com.example.shelftotales.exchange.domain.ExchangeCompletedEvent;
import com.example.shelftotales.social.domain.ActivityFeedItem;
import com.example.shelftotales.social.infrastructure.ActivityFeedItemRepository;
import com.example.shelftotales.review.domain.Review;
import com.example.shelftotales.review.infrastructure.ReviewRepository;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class FeedItemObserverTest {

    @Mock
    private ActivityFeedItemRepository feedRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @InjectMocks
    private FeedItemObserver feedItemObserver;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void onReviewPosted_ShouldSaveFeedItemWithReviewDetailsInMetadata() {
        Long actorId = 1L;
        Long reviewId = 2L;
        Long bookId = 3L;
        String bookTitle = "The Hobbit";

        User mockUser = new User();
        mockUser.setId(actorId);

        Review mockReview = Review.builder()
                .id(reviewId)
                .comment("Great book! Major spoiler: Frodo dies.")
                .rating(4)
                .isSpoiler(true)
                .build();

        when(userRepository.getReferenceById(actorId)).thenReturn(mockUser);
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(mockReview));

        ReviewPostedEvent event = new ReviewPostedEvent(actorId, reviewId, bookId, bookTitle);
        feedItemObserver.onReviewPosted(event);

        ArgumentCaptor<ActivityFeedItem> captor = ArgumentCaptor.forClass(ActivityFeedItem.class);
        verify(feedRepository).save(captor.capture());

        ActivityFeedItem savedItem = captor.getValue();
        assertEquals(mockUser, savedItem.getUser());
        assertEquals("POSTED_REVIEW", savedItem.getActivityType());
        assertEquals(reviewId, savedItem.getReferenceId());
        assertEquals("REVIEW", savedItem.getReferenceType());
        
        String expectedMetadata = "{\"bookTitle\":\"The Hobbit\",\"reviewComment\":\"Great book! Major spoiler: Frodo dies.\",\"rating\":4,\"isSpoiler\":true}";
        assertEquals(expectedMetadata, savedItem.getMetadata());
    }

    @Test
    public void onBookCompleted_ShouldSaveFeedItem() {
        Long actorId = 1L;
        Long bookId = 2L;
        String bookTitle = "Hobbit";

        User mockUser = new User();
        mockUser.setId(actorId);

        when(userRepository.getReferenceById(actorId)).thenReturn(mockUser);

        feedItemObserver.onBookCompleted(new BookCompletedEvent(actorId, bookId, bookTitle, null, null));

        ArgumentCaptor<ActivityFeedItem> captor = ArgumentCaptor.forClass(ActivityFeedItem.class);
        verify(feedRepository).save(captor.capture());
        ActivityFeedItem savedItem = captor.getValue();
        assertEquals(mockUser, savedItem.getUser());
        assertEquals("FINISHED_BOOK", savedItem.getActivityType());
        assertEquals(bookId, savedItem.getReferenceId());
        assertEquals("BOOK", savedItem.getReferenceType());
        assertEquals("{\"bookTitle\":\"Hobbit\"}", savedItem.getMetadata());
        assertEquals("PUBLIC", savedItem.getVisibility());
    }

    @Test
    public void onExchangeCompleted_ShouldSaveFeedItem() {
        Long actorId = 1L;
        Long requestId = 2L;
        Long listerId = 3L;
        Long requesterId = 4L;
        String listingType = "GIVEAWAY";

        User mockUser = new User();
        mockUser.setId(actorId);

        when(userRepository.getReferenceById(actorId)).thenReturn(mockUser);

        feedItemObserver.onExchangeCompleted(new ExchangeCompletedEvent(actorId, requestId, listerId, requesterId, listingType));

        ArgumentCaptor<ActivityFeedItem> captor = ArgumentCaptor.forClass(ActivityFeedItem.class);
        verify(feedRepository).save(captor.capture());
        ActivityFeedItem savedItem = captor.getValue();
        assertEquals(mockUser, savedItem.getUser());
        assertEquals("EXCHANGE_COMPLETED", savedItem.getActivityType());
        assertEquals(requestId, savedItem.getReferenceId());
        assertEquals("EXCHANGE", savedItem.getReferenceType());
        assertEquals("{\"type\":\"GIVEAWAY\"}", savedItem.getMetadata());
        assertEquals("PUBLIC", savedItem.getVisibility());
    }

    @Test
    public void onQuoteShared_ShouldSaveFeedItem() {
        Long actorId = 1L;
        Long quoteId = 2L;
        String bookTitle = "Hobbit";
        String quoteText = "Life is short";
        String themeStyle = "WARM";

        User mockUser = new User();
        mockUser.setId(actorId);

        when(userRepository.getReferenceById(actorId)).thenReturn(mockUser);

        feedItemObserver.onQuoteShared(new QuoteSharedEvent(actorId, quoteId, bookTitle, quoteText, themeStyle));

        ArgumentCaptor<ActivityFeedItem> captor = ArgumentCaptor.forClass(ActivityFeedItem.class);
        verify(feedRepository).save(captor.capture());
        ActivityFeedItem savedItem = captor.getValue();
        assertEquals(mockUser, savedItem.getUser());
        assertEquals("SHARE_QUOTE", savedItem.getActivityType());
        assertEquals(quoteId, savedItem.getReferenceId());
        assertEquals("QUOTE", savedItem.getReferenceType());
        assertEquals("{\"bookTitle\":\"Hobbit\",\"quoteText\":\"Life is short\",\"themeStyle\":\"WARM\"}", savedItem.getMetadata());
        assertEquals("PUBLIC", savedItem.getVisibility());
    }
}
