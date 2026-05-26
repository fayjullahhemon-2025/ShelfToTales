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

import com.example.shelftotales.bookshelf.application.BookshelfRequest;
import com.example.shelftotales.bookshelf.application.BookshelfResponse;
import com.example.shelftotales.bookshelf.domain.Bookshelf;
import com.example.shelftotales.auth.domain.Role;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.bookshelf.infrastructure.BookshelfRepository;
import com.example.shelftotales.bookshelf.infrastructure.ShelfBookRepository;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookshelfServiceTest {

    @Mock
    private BookshelfRepository bookshelfRepository;

    @Mock
    private ShelfBookRepository shelfBookRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BookshelfService bookshelfService;

    private User testUser;
    private Bookshelf shelf1;
    private Bookshelf shelf2;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("user@example.com")
                .role(Role.USER)
                .build();

        shelf1 = Bookshelf.builder()
                .id(1L)
                .name("Read")
                .position(0)
                .user(testUser)
                .build();

        shelf2 = Bookshelf.builder()
                .id(2L)
                .name("Want to Read")
                .position(1)
                .user(testUser)
                .build();
    }

    @Test
    void testReorderOwnShelves() {
        try (MockedStatic<AuthUtils> authUtils = mockStatic(AuthUtils.class)) {
            authUtils.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(bookshelfRepository.findByUserIdOrderByPositionAsc(1L))
                    .thenReturn(List.of(shelf1, shelf2));

            bookshelfService.reorder(List.of(2L, 1L));

            verify(bookshelfRepository).saveAll(any());
            assertEquals(0, shelf2.getPosition());
            assertEquals(1, shelf1.getPosition());
        }
    }

    @Test
    void testReorderUnauthorizedShelf() {
        try (MockedStatic<AuthUtils> authUtils = mockStatic(AuthUtils.class)) {
            authUtils.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(bookshelfRepository.findByUserIdOrderByPositionAsc(1L))
                    .thenReturn(List.of(shelf1, shelf2));

            // Try to reorder with unauthorized shelf ID (999L)
            assertThrows(IllegalArgumentException.class, () -> 
                bookshelfService.reorder(List.of(999L, 1L))
            );

            verify(bookshelfRepository, never()).saveAll(any());
        }
    }

    @Test
    void testCreateBookshelf() {
        try (MockedStatic<AuthUtils> authUtils = mockStatic(AuthUtils.class)) {
            authUtils.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(bookshelfRepository.nextPosition(1L)).thenReturn(0);
            when(bookshelfRepository.save(any(Bookshelf.class))).thenReturn(shelf1);
            when(shelfBookRepository.countByBookshelfId(1L)).thenReturn(0);

            BookshelfRequest request = BookshelfRequest.builder()
                    .name("Read")
                    .theme("glass")
                    .build();

            BookshelfResponse response = bookshelfService.createBookshelf(request);

            assertNotNull(response);
            assertEquals("Read", response.getName());
            verify(bookshelfRepository).save(any(Bookshelf.class));
        }
    }

    @Test
    void testUpdateOwnBookshelf() {
        try (MockedStatic<AuthUtils> authUtils = mockStatic(AuthUtils.class)) {
            authUtils.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(bookshelfRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(shelf1));
            when(bookshelfRepository.save(any(Bookshelf.class))).thenReturn(shelf1);
            when(shelfBookRepository.countByBookshelfId(1L)).thenReturn(0);

            BookshelfRequest request = BookshelfRequest.builder()
                    .name("Currently Reading")
                    .build();

            BookshelfResponse response = bookshelfService.updateBookshelf(1L, request);

            assertNotNull(response);
            verify(bookshelfRepository).save(any(Bookshelf.class));
        }
    }

    @Test
    void testUpdateUnauthorizedBookshelf() {
        try (MockedStatic<AuthUtils> authUtils = mockStatic(AuthUtils.class)) {
            authUtils.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(bookshelfRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

            BookshelfRequest request = BookshelfRequest.builder()
                    .name("Updated")
                    .build();

            assertThrows(IllegalArgumentException.class, () -> 
                bookshelfService.updateBookshelf(999L, request)
            );
        }
    }

    @Test
    void testDeleteOwnBookshelf() {
        try (MockedStatic<AuthUtils> authUtils = mockStatic(AuthUtils.class)) {
            authUtils.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(bookshelfRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(shelf1));

            bookshelfService.deleteBookshelf(1L);

            verify(bookshelfRepository).delete(shelf1);
        }
    }

    @Test
    void testDeleteUnauthorizedBookshelf() {
        try (MockedStatic<AuthUtils> authUtils = mockStatic(AuthUtils.class)) {
            authUtils.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(bookshelfRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class, () -> 
                bookshelfService.deleteBookshelf(999L)
            );
        }
    }
}
