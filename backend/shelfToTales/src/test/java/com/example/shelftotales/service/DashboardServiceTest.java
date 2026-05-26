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

import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.application.*;
import com.example.shelftotales.commerce.infrastructure.*;

import com.example.shelftotales.bookshelf.application.DashboardResponse;
import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.shared.util.AuthUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock private ReadingActivityRepository readingActivityRepository;
    @Mock private BookshelfRepository bookshelfRepository;
    @Mock private ShelfBookRepository shelfBookRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private WishlistRepository wishlistRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private BookRepository bookRepository;
    @Mock private UserRepository userRepository;

    private DashboardService dashboardService;
    private User testUser;

    @BeforeEach
    void setUp() {
        dashboardService = new DashboardService(
            readingActivityRepository, bookshelfRepository, shelfBookRepository,
            cartItemRepository, wishlistRepository, orderRepository, bookRepository, userRepository
        );
        testUser = User.builder()
            .id(1L)
            .fullName("Test User")
            .email("test@example.com")
            .profileImageUrl("https://example.com/avatar.png")
            .createdAt(LocalDateTime.now().minusDays(30))
            .build();
    }

    @Test
    void getDashboard_shouldAggregateAllData() {
        try (var mockedAuth = mockStatic(AuthUtils.class)) {
            mockedAuth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);

            ReadingActivity activity = ReadingActivity.builder()
                .id(1L).user(testUser).book(Book.builder().id(1L).title("Test Book").build())
                .status(ReadingStatus.IN_PROGRESS).currentPage(50).totalPagesRead(50)
                .startedAt(LocalDateTime.now()).lastReadAt(LocalDateTime.now())
                .build();
            when(readingActivityRepository.findByUserIdAndStatusOrderByLastReadAtDesc(1L, ReadingStatus.IN_PROGRESS))
                .thenReturn(List.of(activity));

            when(readingActivityRepository.countByUserIdAndStatus(1L, ReadingStatus.COMPLETED)).thenReturn(5L);
            when(readingActivityRepository.sumTotalPagesReadByUserId(1L)).thenReturn(1000);

            when(bookshelfRepository.countByUserId(1L)).thenReturn(0L);
            when(shelfBookRepository.countDistinctBookIdsByUserId(1L)).thenReturn(10);
            when(bookRepository.countDistinctCategoriesByUserId(1L)).thenReturn(3);

            when(cartItemRepository.findByUserIdWithBook(1L)).thenReturn(List.of());
            when(wishlistRepository.findByUserIdWithBook(1L)).thenReturn(List.of());
            when(orderRepository.countByUserId(1L)).thenReturn(12L);
            when(orderRepository.sumTotalAmountByUserId(1L)).thenReturn(BigDecimal.valueOf(459.75));

            DashboardResponse response = dashboardService.getDashboard();

            assertNotNull(response);
            assertEquals("Test User", response.getFullName());
            assertEquals(1, response.getTotalBooksReading());
            assertEquals(5, response.getTotalBooksCompleted());
            assertEquals(1000, response.getTotalPagesRead());
            assertEquals(10, response.getTotalBooksOwned());
            assertEquals(0, response.getCartItemCount());
            assertEquals(0, response.getWishlistCount());
            assertEquals(12, response.getTotalOrders());
            assertEquals(BigDecimal.valueOf(459.75), response.getTotalSpent());
        }
    }
}
