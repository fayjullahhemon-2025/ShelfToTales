package com.example.shelftotales.bookshelf.application;
import com.example.shelftotales.wishlist.domain.WishlistItem;
import com.example.shelftotales.readingroom.infrastructure.*;

import com.example.shelftotales.shared.dto.*;
import com.example.shelftotales.auth.application.*;
import com.example.shelftotales.catalog.application.*;
import com.example.shelftotales.bookshelf.application.*;
import com.example.shelftotales.commerce.application.*;
import com.example.shelftotales.social.application.*;
import com.example.shelftotales.readingroom.application.*;
import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.auth.infrastructure.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.bookshelf.infrastructure.*;
import com.example.shelftotales.wishlist.infrastructure.*;
import com.example.shelftotales.review.infrastructure.*;
import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.infrastructure.*;
import com.example.shelftotales.commerce.application.*;
import com.example.shelftotales.shared.util.AuthUtils;
import com.example.shelftotales.ai.domain.UserProfileVector;
import com.example.shelftotales.ai.infrastructure.UserProfileVectorRepository;
import com.example.shelftotales.ai.application.EmbeddingService;
import com.example.shelftotales.ai.application.AIService;
import com.example.shelftotales.catalog.domain.BookEmbedding;
import com.example.shelftotales.catalog.infrastructure.BookEmbeddingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final ReadingActivityRepository readingActivityRepository;
    private final BookshelfRepository bookshelfRepository;
    private final ShelfBookRepository shelfBookRepository;
    private final CartItemRepository cartItemRepository;
    private final WishlistRepository wishlistRepository;
    private final OrderRepository orderRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final UserProfileVectorRepository profileVectorRepository;
    private final EmbeddingService embeddingService;
    private final BookEmbeddingRepository bookEmbeddingRepository;
    private final AIService aiService;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        User user = AuthUtils.getCurrentUser(userRepository);

        List<ReadingActivity> activeReadings = safeGet(
            () -> readingActivityRepository.findByUserIdAndStatusOrderByLastReadAtDesc(user.getId(), ReadingStatus.IN_PROGRESS),
            List.of()
        );

        int totalBookshelves = safeGet(
            () -> (int) bookshelfRepository.countByUserId(user.getId()), 0
        );

        List<CartItem> cartItems = safeGet(
            () -> cartItemRepository.findByUserIdWithBook(user.getId()),
            List.of()
        );

        List<WishlistItem> wishlistItems = safeGet(
            () -> wishlistRepository.findByUserIdWithBook(user.getId()),
            List.of()
        );

        int totalBooksReading = activeReadings.size();

        int totalBooksCompleted = safeGet(
            () -> (int) readingActivityRepository.countByUserIdAndStatus(user.getId(), ReadingStatus.COMPLETED), 0
        );

        int totalPagesRead = safeGet(
            () -> readingActivityRepository.sumTotalPagesReadByUserId(user.getId()), 0
        );

        int totalBooksOwned = safeGet(
            () -> shelfBookRepository.countDistinctBookIdsByUserId(user.getId()), 0
        );

        int totalCategoriesOwned = safeGet(
            () -> bookRepository.countDistinctCategoriesByUserId(user.getId()), 0
        );

        int cartItemCount = cartItems.size();

        BigDecimal cartTotalValue = BigDecimal.ZERO;
        for (CartItem item : cartItems) {
            if (item.getBook().getPrice() != null) {
                cartTotalValue = cartTotalValue.add(
                    item.getBook().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                );
            }
        }

        int wishlistCount = wishlistItems.size();

        int totalOrders = safeGet(
            () -> (int) orderRepository.countByUserId(user.getId()), 0
        );

        BigDecimal totalSpent = safeGet(
            () -> orderRepository.sumTotalAmountByUserId(user.getId()), BigDecimal.ZERO
        );

        List<CategoryBreakdownDTO> booksByCategory = buildCategoryBreakdown(user.getId());
        List<CurrentlyReadingDTO> currentlyReading = buildCurrentlyReading(activeReadings);
        List<RecentActivityDTO> recentActivities = buildRecentActivity(activeReadings, cartItems, wishlistItems);
        List<RecommendedBookDTO> recommendations = getDashboardRecommendations(user.getId());

        return DashboardResponse.builder()
            .fullName(user.getFullName())
            .email(user.getEmail())
            .profileImageUrl(user.getProfileImageUrl())
            .memberSince(user.getCreatedAt() != null ? user.getCreatedAt().toLocalDate() : null)
            .totalBooksReading(totalBooksReading)
            .totalBooksCompleted(totalBooksCompleted)
            .totalPagesRead(totalPagesRead)
            .currentlyReading(currentlyReading)
            .totalBookshelves(totalBookshelves)
            .totalBooksOwned(totalBooksOwned)
            .totalCategoriesOwned(totalCategoriesOwned)
            .booksByCategory(booksByCategory)
            .cartItemCount(cartItemCount)
            .cartTotalValue(cartTotalValue)
            .wishlistCount(wishlistCount)
            .totalOrders(totalOrders)
            .totalSpent(totalSpent)
            .recentActivities(recentActivities)
            .recommendations(recommendations)
            .build();
    }

    private List<CurrentlyReadingDTO> buildCurrentlyReading(List<ReadingActivity> activities) {
        return activities.stream()
            .map(ra -> CurrentlyReadingDTO.builder()
                .bookId(ra.getBook().getId())
                .title(ra.getBook().getTitle())
                .author(ra.getBook().getAuthor())
                .coverUrl(ra.getBook().getCoverUrl())
                .currentPage(ra.getCurrentPage())
                .totalPagesRead(ra.getTotalPagesRead())
                .status(ra.getStatus())
                .build())
            .collect(Collectors.toList());
    }

    private List<CategoryBreakdownDTO> buildCategoryBreakdown(Long userId) {
        return safeGet(() -> bookRepository.findCategoryBreakdownByUserId(userId), List.of());
    }

    private List<RecentActivityDTO> buildRecentActivity(
            List<ReadingActivity> readings,
            List<CartItem> cartItems,
            List<WishlistItem> wishlistItems) {
        Stream<RecentActivityDTO> readingStream = readings.stream()
            .map(ra -> RecentActivityDTO.builder()
                .type(ActivityType.READING_UPDATED)
                .message("Reading \"" + ra.getBook().getTitle() + "\" — page " + ra.getCurrentPage())
                .timestamp(ra.getLastReadAt())
                .build());
        Stream<RecentActivityDTO> cartStream = cartItems.stream()
            .map(ci -> RecentActivityDTO.builder()
                .type(ActivityType.CART_ADDED)
                .message("Added \"" + ci.getBook().getTitle() + "\" to cart")
                .timestamp(ci.getCreatedAt())
                .build());
        Stream<RecentActivityDTO> wishlistStream = wishlistItems.stream()
            .map(wi -> RecentActivityDTO.builder()
                .type(ActivityType.WISHLIST_ADDED)
                .message("Added \"" + wi.getBook().getTitle() + "\" to wishlist")
                .timestamp(wi.getAddedAt())
                .build());

        return Stream.of(readingStream, cartStream, wishlistStream)
            .flatMap(s -> s)
            .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
            .limit(10)
            .collect(Collectors.toList());
    }

    private List<RecommendedBookDTO> getDashboardRecommendations(Long userId) {
        return safeGet(() -> {
            Optional<UserProfileVector> profileOpt = profileVectorRepository.findById(userId);
            if (profileOpt.isEmpty()) {
                return getFallbackRecommendations();
            }

            double[] userVec = aiService.stringToVector(profileOpt.get().getVectorData());
            List<Long> matchedIds = embeddingService.getSimilarBookIds(userVec, 3);
            if (matchedIds.isEmpty()) {
                return getFallbackRecommendations();
            }

            List<BookEmbedding> embeddings = bookEmbeddingRepository.findAllById(matchedIds);
            if (embeddings.isEmpty()) {
                return getFallbackRecommendations();
            }

            return embeddings.stream()
                .map(emb -> Map.entry(emb.getBook(),
                        aiService.calculateSimilarity(userVec, aiService.stringToVector(emb.getVectorData()))))
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .map(e -> RecommendedBookDTO.builder()
                        .bookId(e.getKey().getId()).title(e.getKey().getTitle())
                        .author(e.getKey().getAuthor()).coverUrl(e.getKey().getCoverUrl())
                        .score(e.getValue())
                        .reason(String.format("AI Match: %.0f%% - Tailored to your reading taste", Math.max(0.0, Math.min(1.0, e.getValue())) * 100))
                        .build())
                .collect(Collectors.toList());
        }, Collections.emptyList());
    }

    private List<RecommendedBookDTO> getFallbackRecommendations() {
        return bookRepository.findAll(org.springframework.data.domain.PageRequest.of(0, 3)).getContent().stream()
            .map(b -> RecommendedBookDTO.builder()
                .bookId(b.getId()).title(b.getTitle()).author(b.getAuthor())
                .coverUrl(b.getCoverUrl()).score(0.5).reason("Trending in our Bookstore").build())
            .collect(Collectors.toList());
    }

    private <T> T safeGet(Supplier<T> supplier, T fallback) {
        try { return supplier.get(); }
        catch (Exception e) {
            log.warn("Dashboard aggregation section failed", e);
            return fallback;
        }
    }
}
