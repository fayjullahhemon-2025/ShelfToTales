package com.example.shelftotales.service;
import com.example.shelftotales.review.domain.*;
import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.auth.application.*;
import com.example.shelftotales.auth.infrastructure.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.catalog.application.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.bookshelf.application.*;
import com.example.shelftotales.bookshelf.infrastructure.*;
import com.example.shelftotales.bookshelf.presentation.*;
import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.application.*;
import com.example.shelftotales.commerce.infrastructure.*;
import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.social.application.*;
import com.example.shelftotales.social.infrastructure.*;
import com.example.shelftotales.gamification.domain.*;
import com.example.shelftotales.gamification.application.*;
import com.example.shelftotales.gamification.infrastructure.*;
import com.example.shelftotales.exchange.domain.*;
import com.example.shelftotales.exchange.application.*;
import com.example.shelftotales.exchange.infrastructure.*;
import com.example.shelftotales.ai.application.*;
import com.example.shelftotales.readingroom.domain.*;
import com.example.shelftotales.readingroom.application.*;
import com.example.shelftotales.readingroom.infrastructure.*;
import com.example.shelftotales.review.application.*;
import com.example.shelftotales.review.infrastructure.*;
import com.example.shelftotales.wishlist.application.*;
import com.example.shelftotales.wishlist.infrastructure.*;
import com.example.shelftotales.shared.security.*;
import com.example.shelftotales.shared.util.*;
import com.example.shelftotales.auth.presentation.*;
import com.example.shelftotales.shared.dto.*;

import com.example.shelftotales.ai.application.AIService;

import com.example.shelftotales.review.application.ReviewRequest;
import com.example.shelftotales.review.application.ReviewResponse;
import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.shared.util.AuthUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AIService aiService;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ReviewService reviewService;

    private User testUser;
    private Book testBook;
    private Review testReview;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("user@example.com")
                .fullName("John Doe")
                .role(Role.USER)
                .build();

        testBook = Book.builder()
                .id(10L)
                .title("Test Book")
                .author("Author")
                .stock(5)
                .build();

        testReview = Review.builder()
                .id(100L)
                .book(testBook)
                .user(testUser)
                .rating(4)
                .comment("Great book!")
                .isSpoiler(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void addReview_success() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(bookRepository.findById(10L)).thenReturn(Optional.of(testBook));
            when(reviewRepository.findByBookIdAndUserId(10L, 1L)).thenReturn(Optional.empty());
            when(aiService.isSpoilerReview("Great book!")).thenReturn(false);
            when(reviewRepository.save(any(Review.class))).thenReturn(testReview);

            ReviewRequest request = ReviewRequest.builder()
                    .rating(4)
                    .comment("Great book!")
                    .isSpoiler(false)
                    .build();

            ReviewResponse response = reviewService.addReview(10L, request);

            assertNotNull(response);
            assertEquals(100L, response.getId());
            assertEquals(4, response.getRating());
            assertEquals("Great book!", response.getComment());
            assertFalse(response.isSpoiler());
            assertEquals("John Doe", response.getUser().getUsername());

            verify(reviewRepository).save(any(Review.class));
        }
    }

    @Test
    void addReview_duplicateReview_throwsException() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(bookRepository.findById(10L)).thenReturn(Optional.of(testBook));
            when(reviewRepository.findByBookIdAndUserId(10L, 1L)).thenReturn(Optional.of(testReview));

            ReviewRequest request = ReviewRequest.builder()
                    .rating(5)
                    .comment("Duplicate review attempt")
                    .isSpoiler(false)
                    .build();

            IllegalArgumentException ex = assertThrows(
                    IllegalArgumentException.class,
                    () -> reviewService.addReview(10L, request)
            );

            assertEquals("You have already reviewed this book", ex.getMessage());
            verify(reviewRepository, never()).save(any());
        }
    }

    @Test
    void getReviewsByBookId_returnsReviews() {
        when(bookRepository.existsById(10L)).thenReturn(true);
        when(reviewRepository.findByBookIdOrderByCreatedAtDesc(10L)).thenReturn(List.of(testReview));

        List<ReviewResponse> reviews = reviewService.getReviewsByBookId(10L);

        assertNotNull(reviews);
        assertEquals(1, reviews.size());
        assertEquals("Great book!", reviews.get(0).getComment());
    }

    @Test
    void getReviewsByBookId_invalidBook_throwsException() {
        when(bookRepository.existsById(999L)).thenReturn(false);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> reviewService.getReviewsByBookId(999L)
        );

        assertTrue(ex.getMessage().contains("Book not found"));
        verify(reviewRepository, never()).findByBookIdOrderByCreatedAtDesc(anyLong());
    }
}
