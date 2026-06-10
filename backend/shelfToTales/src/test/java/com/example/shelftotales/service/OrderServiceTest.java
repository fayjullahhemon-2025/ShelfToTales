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

import com.example.shelftotales.commerce.application.OrderResponse;
import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.notification.NotificationFactory;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.shared.util.AuthUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationFactory notificationFactory;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private OrderService orderService;

    private User testUser;
    private Book testBook;
    private CartItem testCartItem;

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
                .price(BigDecimal.valueOf(15.00))
                .stock(5)
                .build();

        testCartItem = CartItem.builder()
                .id(100L)
                .user(testUser)
                .book(testBook)
                .quantity(2)
                .build();
    }

    @Test
    void checkout_success() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(cartItemRepository.findByUserIdWithBook(1L)).thenReturn(List.of(testCartItem));

            Order expectedOrder = Order.builder()
                    .id(1000L)
                    .user(testUser)
                    .orderDate(LocalDateTime.now())
                    .status(OrderStatus.CONFIRMED)
                    .totalAmount(BigDecimal.valueOf(30.00))
                    .items(new ArrayList<>())
                    .build();
            OrderItem expectedItem = OrderItem.builder()
                    .id(200L)
                    .order(expectedOrder)
                    .book(testBook)
                    .quantity(2)
                    .price(BigDecimal.valueOf(15.00))
                    .build();
            expectedOrder.getItems().add(expectedItem);

            when(orderRepository.save(any(Order.class))).thenReturn(expectedOrder);

            OrderResponse response = orderService.checkout();

            assertNotNull(response);
            assertEquals(1000L, response.getId());
            assertEquals(OrderStatus.CONFIRMED, response.getStatus());
            assertEquals(0, BigDecimal.valueOf(30.00).compareTo(response.getTotalAmount()));
            assertEquals(1, response.getItems().size());
            assertEquals("Test Book", response.getItems().get(0).getBookTitle());
            assertEquals(3, testBook.getStock()); // stock deducted: 5 - 2 = 3

            verify(bookRepository).save(testBook);
            verify(cartItemRepository).deleteAllByUserId(1L);
            verify(orderRepository).save(any(Order.class));
        }
    }

    @Test
    void checkout_emptyCart_throwsException() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(cartItemRepository.findByUserIdWithBook(1L)).thenReturn(Collections.emptyList());

            IllegalArgumentException ex = assertThrows(
                    IllegalArgumentException.class,
                    () -> orderService.checkout()
            );

            assertEquals("Cart is empty", ex.getMessage());
            verify(orderRepository, never()).save(any());
        }
    }

    @Test
    void checkout_insufficientStock_throwsException() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            testCartItem.setQuantity(10); // requests 10, stock is 5
            when(cartItemRepository.findByUserIdWithBook(1L)).thenReturn(List.of(testCartItem));

            IllegalArgumentException ex = assertThrows(
                    IllegalArgumentException.class,
                    () -> orderService.checkout()
            );

            assertTrue(ex.getMessage().contains("Insufficient stock"));
            verify(orderRepository, never()).save(any());
        }
    }

    @Test
    void getHistory_returnsUserOrders() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);

            Order order = Order.builder()
                    .id(1000L)
                    .user(testUser)
                    .orderDate(LocalDateTime.now())
                    .status(OrderStatus.CONFIRMED)
                    .totalAmount(BigDecimal.valueOf(30.00))
                    .items(new ArrayList<>())
                    .build();

            when(orderRepository.findByUserIdOrderByOrderDateDesc(1L)).thenReturn(List.of(order));

            List<OrderResponse> history = orderService.getHistory();

            assertNotNull(history);
            assertEquals(1, history.size());
            assertEquals(1000L, history.get(0).getId());
        }
    }

    @Test
    void getOrderById_returnsMatchingOrderForCurrentUser() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);

            Order order = Order.builder()
                    .id(1000L)
                    .user(testUser)
                    .orderDate(LocalDateTime.now())
                    .status(OrderStatus.CONFIRMED)
                    .totalAmount(BigDecimal.valueOf(30.00))
                    .items(new ArrayList<>())
                    .build();

            when(orderRepository.findByIdAndUserIdWithItems(1000L, 1L)).thenReturn(Optional.of(order));

            OrderResponse response = orderService.getOrderById(1000L);

            assertNotNull(response);
            assertEquals(1000L, response.getId());
            assertEquals(OrderStatus.CONFIRMED, response.getStatus());
            verify(orderRepository).findByIdAndUserIdWithItems(1000L, 1L);
        }
    }
}
