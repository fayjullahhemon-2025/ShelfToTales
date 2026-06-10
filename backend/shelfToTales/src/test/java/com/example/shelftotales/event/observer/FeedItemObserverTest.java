package com.example.shelftotales.event.observer;

import com.example.shelftotales.event.ReviewPostedEvent;
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
}
