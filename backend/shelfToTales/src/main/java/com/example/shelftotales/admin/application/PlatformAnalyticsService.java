package com.example.shelftotales.admin.application;
import com.example.shelftotales.admin.domain.*;
import com.example.shelftotales.admin.infrastructure.*;

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
import com.example.shelftotales.social.infrastructure.FollowRepository;
import com.example.shelftotales.gamification.infrastructure.ReadingChallengeRepository;
import com.example.shelftotales.exchange.domain.*;
import com.example.shelftotales.exchange.infrastructure.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PlatformAnalyticsService {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final ExchangeListingRepository exchangeListingRepository;
    private final ReadingChallengeRepository challengeRepository;
    private final FollowRepository followRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        stats.put("totalUsers", userRepository.count());
        stats.put("totalBooks", bookRepository.count());
        stats.put("totalOrders", orderRepository.count());
        stats.put("totalReviews", reviewRepository.count());
        stats.put("totalExchangeListings", exchangeListingRepository.count());
        stats.put("totalChallenges", challengeRepository.count());

        // Revenue (sum of all order totals)
        BigDecimal revenue = orderRepository.findAll().stream()
                .map(o -> o.getTotalAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalRevenue", revenue);

        List<Order> orders = orderRepository.findAll();
        List<User> users = userRepository.findAll();
        stats.put("weeklyOrders", buildWeeklySeries(orders));
        stats.put("monthlyUsers", buildMonthlySeries(users));

        return stats;
    }

    private Map<String, Object> buildWeeklySeries(List<Order> orders) {
        Map<String, Object> series = new LinkedHashMap<>();
        List<String> labels = new ArrayList<>();
        List<Integer> data = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d", Locale.ENGLISH);
        LocalDate today = LocalDate.now();

        for (int offset = 6; offset >= 0; offset--) {
            LocalDate day = today.minusDays(offset);
            labels.add(day.format(formatter));
            data.add((int) orders.stream()
                    .filter(order -> order.getOrderDate() != null && order.getOrderDate().toLocalDate().equals(day))
                    .count());
        }

        series.put("labels", labels);
        series.put("data", data);
        return series;
    }

    private Map<String, Object> buildMonthlySeries(List<User> users) {
        Map<String, Object> series = new LinkedHashMap<>();
        List<String> labels = new ArrayList<>();
        List<Integer> data = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);
        YearMonth currentMonth = YearMonth.now();

        for (int offset = 5; offset >= 0; offset--) {
            YearMonth month = currentMonth.minusMonths(offset);
            labels.add(month.format(formatter));
            data.add((int) users.stream()
                    .filter(user -> user.getCreatedAt() != null && YearMonth.from(user.getCreatedAt()).equals(month))
                    .count());
        }

        series.put("labels", labels);
        series.put("data", data);
        return series;
    }
}
