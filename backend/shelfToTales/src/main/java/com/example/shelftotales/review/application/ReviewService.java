package com.example.shelftotales.review.application;

import com.example.shelftotales.review.application.ReviewRequest;
import com.example.shelftotales.review.application.ReviewResponse;
import com.example.shelftotales.event.ReviewPostedEvent;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.review.domain.Review;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.review.infrastructure.ReviewRepository;
import com.example.shelftotales.ai.application.AIService;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final AIService aiService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ReviewResponse addReview(Long bookId, ReviewRequest request) {
        User user = AuthUtils.getCurrentUser(userRepository);
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found: " + bookId));

        // Check if user has already reviewed the book
        reviewRepository.findByBookIdAndUserId(bookId, user.getId()).ifPresent(r -> {
            throw new IllegalArgumentException("You have already reviewed this book");
        });

        boolean autoSpoiler = aiService.isSpoilerReview(request.getComment());
        boolean isSpoilerFinal = request.isSpoiler() || autoSpoiler;

        Review review = Review.builder()
                .book(book)
                .user(user)
                .rating(request.getRating())
                .comment(request.getComment())
                .isSpoiler(isSpoilerFinal)
                .build();

        Review savedReview = reviewRepository.save(review);

        eventPublisher.publishEvent(new ReviewPostedEvent(
                user.getId(), savedReview.getId(), book.getId(), book.getTitle()));

        return mapToReviewResponse(savedReview);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByBookId(Long bookId) {
        if (!bookRepository.existsById(bookId)) {
            throw new IllegalArgumentException("Book not found: " + bookId);
        }
        return reviewRepository.findByBookIdOrderByCreatedAtDesc(bookId).stream()
                .map(this::mapToReviewResponse)
                .collect(Collectors.toList());
    }

    private ReviewResponse mapToReviewResponse(Review review) {
        String username = review.getUser().getFullName();
        if (username == null || username.isBlank()) {
            username = review.getUser().getEmail();
        }

        return ReviewResponse.builder()
                .id(review.getId())
                .bookId(review.getBook().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .isSpoiler(review.isSpoiler())
                .createdAt(review.getCreatedAt())
                .user(ReviewResponse.UserSummary.builder()
                        .id(review.getUser().getId())
                        .username(username)
                        .profileImageUrl(review.getUser().getProfileImageUrl())
                        .build())
                .build();
    }
}
