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

import com.example.shelftotales.commerce.application.CartItemRequest;
import com.example.shelftotales.commerce.application.CartResponse;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.auth.domain.Role;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private CartService cartService;

    private User testUser;
    private Book testBook;
    private CartItem existingItem;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("user@example.com")
                .role(Role.USER)
                .build();

        testBook = Book.builder()
                .id(10L)
                .title("Test Book")
                .author("Author")
                .price(BigDecimal.valueOf(15.00))
                .stock(5)
                .build();

        existingItem = CartItem.builder()
                .id(100L)
                .user(testUser)
                .book(testBook)
                .quantity(2)
                .build();
    }

    @Test
    void getCart_returnsResponseWithCorrectTotal() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(cartItemRepository.findByUserIdWithBook(1L)).thenReturn(List.of(existingItem));

            CartResponse response = cartService.getCart();

            assertEquals(1, response.getTotalItems());
            // 15.00 * 2 = 30.00
            assertEquals(0, BigDecimal.valueOf(30.00).compareTo(response.getTotalPrice()));
        }
    }

    @Test
    void addToCart_newBook_createsItem() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(bookRepository.findById(10L)).thenReturn(Optional.of(testBook));
            when(cartItemRepository.findByUserIdAndBookId(1L, 10L)).thenReturn(Optional.empty());
            when(cartItemRepository.findByUserIdWithBook(1L)).thenReturn(List.of());

            cartService.addToCart(10L, 2);

            verify(cartItemRepository).save(any(CartItem.class));
        }
    }

    @Test
    void addToCart_existingBook_incrementsQuantity() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(bookRepository.findById(10L)).thenReturn(Optional.of(testBook));
            when(cartItemRepository.findByUserIdAndBookId(1L, 10L)).thenReturn(Optional.of(existingItem));
            when(cartItemRepository.findByUserIdWithBook(1L)).thenReturn(List.of(existingItem));

            cartService.addToCart(10L, 1);

            // Existing item quantity bumps from 2 to 3.
            assertEquals(3, existingItem.getQuantity());
            verify(cartItemRepository).save(existingItem);
        }
    }

    @Test
    void addToCart_overStock_throwsAndDoesNotPersist() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(bookRepository.findById(10L)).thenReturn(Optional.of(testBook));

            // testBook stock = 5; requesting 10 must fail before any save.
            IllegalArgumentException ex = assertThrows(
                    IllegalArgumentException.class,
                    () -> cartService.addToCart(10L, 10)
            );
            assertTrue(ex.getMessage().toLowerCase().contains("stock"));
            verify(cartItemRepository, never()).save(any());
        }
    }

    @Test
    void addToCart_unknownBook_throws() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(bookRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(
                    IllegalArgumentException.class,
                    () -> cartService.addToCart(999L, 1)
            );
            verify(cartItemRepository, never()).save(any());
        }
    }

    @Test
    void removeFromCart_callsRepository() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(cartItemRepository.findByUserIdWithBook(1L)).thenReturn(List.of());

            cartService.removeFromCart(10L);

            verify(cartItemRepository).deleteByUserIdAndBookId(1L, 10L);
        }
    }

    /**
     * Smoke test that {@link CartItemRequest} does not crash when used as
     * a value carrier — guards against accidental Lombok regressions.
     */
    @Test
    void cartItemRequest_builderProducesNonNullObject() {
        CartItemRequest req = CartItemRequest.builder().quantity(3).build();
        assertEquals(3, req.getQuantity());
    }
}
