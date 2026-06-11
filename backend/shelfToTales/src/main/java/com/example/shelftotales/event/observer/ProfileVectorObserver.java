package com.example.shelftotales.event.observer;

import com.example.shelftotales.event.*;
import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.auth.infrastructure.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.bookshelf.infrastructure.*;
import com.example.shelftotales.commerce.infrastructure.OrderRepository;
import com.example.shelftotales.ai.application.AIService;
import com.example.shelftotales.ai.infrastructure.UserProfileVectorRepository;
import com.example.shelftotales.ai.domain.UserProfileVector;
import com.example.shelftotales.blog.infrastructure.BlogPostRepository;
import com.example.shelftotales.blog.domain.BlogPost;
import com.example.shelftotales.review.infrastructure.ReviewRepository;
import com.example.shelftotales.review.domain.Review;
import com.example.shelftotales.exchange.infrastructure.ExchangeListingRepository;
import com.example.shelftotales.exchange.domain.ExchangeListing;
import com.example.shelftotales.wishlist.infrastructure.WishlistRepository;
import com.example.shelftotales.wishlist.domain.WishlistItem;
import com.example.shelftotales.social.infrastructure.FollowRepository;
import com.example.shelftotales.commerce.domain.Order;
import com.example.shelftotales.commerce.domain.OrderItem;
import com.example.shelftotales.bookshelf.domain.ShelfBook;
import java.time.LocalDateTime;
import org.springframework.data.domain.PageRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProfileVectorObserver {

    private final UserProfileVectorRepository profileVectorRepository;
    private final BookEmbeddingRepository bookEmbeddingRepository;
    private final ShelfBookRepository shelfBookRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final AIService aiService;
    private final BlogPostRepository blogPostRepository;
    private final ReviewRepository reviewRepository;
    private final ExchangeListingRepository exchangeListingRepository;
    private final WishlistRepository wishlistRepository;
    private final FollowRepository followRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onBookCompleted(BookCompletedEvent event) {
        try {
            recalculateUserVector(event.getActorId());
        } catch (Exception e) {
            log.warn("Failed to update profile vector for user {} on book completion: {}", event.getActorId(), e.getMessage());
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onOrderConfirmed(OrderConfirmedEvent event) {
        try {
            recalculateUserVector(event.getActorId());
        } catch (Exception e) {
            log.warn("Failed to update profile vector for user {} on order confirmation: {}", event.getActorId(), e.getMessage());
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onReviewPosted(ReviewPostedEvent event) {
        try {
            recalculateUserVector(event.getActorId());
        } catch (Exception e) {
            log.warn("Failed to update profile vector for user {} on review: {}", event.getActorId(), e.getMessage());
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onBlogCreated(BlogCreatedEvent event) {
        try {
            recalculateUserVector(event.getActorId());
        } catch (Exception e) {
            log.warn("Failed to update profile vector for user {} on blog: {}", event.getActorId(), e.getMessage());
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onWishlistAdded(WishlistAddedEvent event) {
        try {
            recalculateUserVector(event.getActorId());
        } catch (Exception e) {
            log.warn("Failed to update profile vector for user {} on wishlist: {}", event.getActorId(), e.getMessage());
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onUserFollowed(UserFollowedEvent event) {
        try {
            recalculateUserVector(event.getActorId());
        } catch (Exception e) {
            log.warn("Failed to update profile vector for user {} on follow: {}", event.getActorId(), e.getMessage());
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onExchangeCompleted(ExchangeCompletedEvent event) {
        try {
            recalculateUserVector(event.getActorId());
        } catch (Exception e) {
            log.warn("Failed to update profile vector for user {} on exchange: {}", event.getActorId(), e.getMessage());
        }
    }

    private double calculateDecayWeight(LocalDateTime eventDate, double baseWeight) {
        if (eventDate == null) {
            return baseWeight * 0.5;
        }
        long days = java.time.temporal.ChronoUnit.DAYS.between(eventDate, LocalDateTime.now());
        if (days < 0) days = 0;
        // half-life of 30 days: weight = baseWeight * exp(-0.0231 * days)
        double decay = Math.exp(-0.0231 * days);
        return baseWeight * Math.max(0.2, decay);
    }

    private void recalculateUserVector(Long userId) {
        Map<Long, Double> bookWeights = new HashMap<>();

        // Source 1: Completed books (weight 1.5 with decay)
        try {
            List<ShelfBook> completedShelfBooks = shelfBookRepository.findShelfBooksByUserIdAndStatus(userId, "COMPLETED");
            for (ShelfBook sb : completedShelfBooks) {
                if (sb.getBook() != null) {
                    double decayWeight = calculateDecayWeight(sb.getAddedAt(), 1.5);
                    bookWeights.merge(sb.getBook().getId(), decayWeight, Math::max);
                }
            }
        } catch (Exception e) {
            log.debug("Could not fetch completed books for user {}: {}", userId, e.getMessage());
        }

        // Source 2: Purchased books (weight 1.5 with decay)
        try {
            List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(userId);
            for (Order o : orders) {
                if (o.getStatus() != com.example.shelftotales.commerce.domain.OrderStatus.CANCELLED) {
                    for (OrderItem item : o.getItems()) {
                        if (item.getBook() != null) {
                            double decayWeight = calculateDecayWeight(o.getOrderDate(), 1.5);
                            bookWeights.merge(item.getBook().getId(), decayWeight, Math::max);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Could not fetch orders for user {}: {}", userId, e.getMessage());
        }

        // Source 3: Reading books (weight 1.0 with decay)
        try {
            List<ShelfBook> readingShelfBooks = shelfBookRepository.findShelfBooksByUserIdAndStatus(userId, "READING");
            for (ShelfBook sb : readingShelfBooks) {
                if (sb.getBook() != null) {
                    double decayWeight = calculateDecayWeight(sb.getAddedAt(), 1.0);
                    bookWeights.merge(sb.getBook().getId(), decayWeight, Math::max);
                }
            }
        } catch (Exception e) {
            log.debug("Could not fetch reading books for user {}: {}", userId, e.getMessage());
        }

        // Source 4: Exchange listings (weight 1.0 with decay)
        try {
            List<ExchangeListing> listings = exchangeListingRepository
                    .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 20)).getContent();
            for (ExchangeListing listing : listings) {
                if (listing.getBook() != null) {
                    double decayWeight = calculateDecayWeight(listing.getCreatedAt(), 1.0);
                    bookWeights.merge(listing.getBook().getId(), decayWeight, Math::max);
                }
            }
        } catch (Exception e) {
            log.debug("Could not fetch exchange listings for user {}: {}", userId, e.getMessage());
        }

        // Source 5: Wishlist (weight 0.7 with decay)
        try {
            List<WishlistItem> wishlistItems = wishlistRepository.findByUserIdWithBook(userId);
            for (WishlistItem item : wishlistItems) {
                if (item.getBook() != null) {
                    double decayWeight = calculateDecayWeight(item.getAddedAt(), 0.7);
                    bookWeights.merge(item.getBook().getId(), decayWeight, Math::max);
                }
            }
        } catch (Exception e) {
            log.debug("Could not fetch wishlist for user {}: {}", userId, e.getMessage());
        }

        // Source 8: Social signals — followed users' completed books (weight 0.8 with decay)
        try {
            List<Long> followedUserIds = followRepository.findFollowingIds(userId);
            for (Long followedUserId : followedUserIds) {
                List<ShelfBook> theirBooks = shelfBookRepository.findShelfBooksByUserIdAndStatus(followedUserId, "COMPLETED");
                for (ShelfBook sb : theirBooks) {
                    if (sb.getBook() != null) {
                        double decayWeight = calculateDecayWeight(sb.getAddedAt(), 0.8);
                        bookWeights.merge(sb.getBook().getId(), decayWeight, Math::max);
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Could not fetch social signals for user {}: {}", userId, e.getMessage());
        }

        // Build final vector from book embeddings
        List<BookEmbedding> embeddings = bookEmbeddingRepository.findAllById(bookWeights.keySet());
        if (embeddings.isEmpty()) {
            return;
        }

        double[] avgVector = new double[384];
        double totalWeight = 0;

        for (BookEmbedding emb : embeddings) {
            double weight = bookWeights.getOrDefault(emb.getBookId(), 1.0);
            double[] vec = aiService.stringToVector(emb.getVectorData());
            if (vec.length == 384) {
                for (int i = 0; i < 384; i++) {
                    avgVector[i] += vec[i] * weight;
                }
                totalWeight += weight;
            }
        }

        if (totalWeight == 0) return;
        for (int i = 0; i < 384; i++) avgVector[i] /= totalWeight;

        // Normalize
        double norm = 0;
        for (double v : avgVector) norm += v * v;
        norm = Math.sqrt(norm);
        if (norm > 0) for (int i = 0; i < 384; i++) avgVector[i] /= norm;

        User user = userRepository.getReferenceById(userId);
        UserProfileVector profile = profileVectorRepository.findById(userId)
                .orElse(UserProfileVector.builder().user(user).userId(userId).build());
        profile.setVectorData(aiService.vectorToString(avgVector));
        profileVectorRepository.save(profile);
    }
}
