package com.example.shelftotales.bookshelf.application;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.bookshelf.domain.ReadingActivity;
import com.example.shelftotales.bookshelf.domain.ActivityType;
import com.example.shelftotales.commerce.domain.CartItem;
import com.example.shelftotales.wishlist.domain.WishlistItem;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final UserRepository userRepository;
    private final ReadingStatsService readingStatsService;
    private final CommerceStatsService commerceStatsService;
    private final DashboardRecommendationService dashboardRecommendationService;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private DashboardService self;

    @org.springframework.cache.annotation.Cacheable(value = "dashboardStats", key = "#userId")
    @Transactional(readOnly = true)
    public DashboardResponse getDashboardCached(Long userId, User user) {
        List<ReadingActivity> activeReadings = readingStatsService.getActiveReadings(userId);
        int totalBookshelves = readingStatsService.getTotalBookshelves(userId);
        int totalBooksReading = activeReadings.size();
        int totalBooksCompleted = readingStatsService.getCompletedCount(userId);
        int totalPagesRead = readingStatsService.getPagesRead(userId);
        int totalBooksOwned = readingStatsService.getBooksOwned(userId);
        int totalCategoriesOwned = readingStatsService.getCategoriesOwned(userId);

        List<CartItem> cartItems = commerceStatsService.getCartItems(userId);
        List<WishlistItem> wishlistItems = commerceStatsService.getWishlistItems(userId);
        int cartItemCount = cartItems.size();
        BigDecimal cartTotalValue = commerceStatsService.getCartTotalValue(cartItems);
        int wishlistCount = wishlistItems.size();
        int totalOrders = commerceStatsService.getOrderCount(userId);
        BigDecimal totalSpent = commerceStatsService.getTotalSpent(userId);

        List<CategoryBreakdownDTO> booksByCategory = readingStatsService.buildCategoryBreakdown(userId);
        List<CurrentlyReadingDTO> currentlyReading = readingStatsService.buildCurrentlyReading(activeReadings);
        List<RecentActivityDTO> recentActivities = buildRecentActivity(activeReadings, cartItems, wishlistItems);
        List<RecommendedBookDTO> recommendations = dashboardRecommendationService.getDashboardRecommendations(userId);

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

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        User user = AuthUtils.getCurrentUser(userRepository);
        return (self != null ? self : this).getDashboardCached(user.getId(), user);
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
}
