package com.example.shelftotales.service;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.social.application.*;
import com.example.shelftotales.social.domain.SharedQuote;
import com.example.shelftotales.social.infrastructure.SharedQuoteRepository;
import com.example.shelftotales.shared.exception.ResourceNotFoundException;
import com.example.shelftotales.shared.util.AuthUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SharedQuoteServiceTest {
    @Mock private SharedQuoteRepository quoteRepository;
    @Mock private UserRepository userRepository;
    @Mock private BookRepository bookRepository;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private SharedQuoteService quoteService;

    private User testUser;
    private Book testBook;
    private SharedQuote testQuote;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(1L).email("user@test.com").fullName("Test User").role(Role.USER).build();
        testBook = Book.builder().id(10L).title("Book Title").author("Author").build();
        testQuote = SharedQuote.builder().id(100L).user(testUser).book(testBook).quoteText("Selected Quote").themeStyle("sunset").build();
    }

    @Test
    void shareQuote_succeeds() {
        try (MockedStatic<AuthUtils> authUtils = mockStatic(AuthUtils.class)) {
            authUtils.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(bookRepository.findById(10L)).thenReturn(Optional.of(testBook));
            when(quoteRepository.save(any(SharedQuote.class))).thenReturn(testQuote);

            SharedQuoteRequest req = new SharedQuoteRequest("Selected Quote", "Nice quote", "sunset");
            SharedQuoteResponse res = quoteService.shareQuote(10L, req);

            assertNotNull(res);
            assertEquals(100L, res.getId());
            assertEquals("Selected Quote", res.getQuoteText());
            verify(eventPublisher, times(1)).publishEvent(any(Object.class));
        }
    }

    @Test
    void shareQuote_bookNotFound_throws() {
        try (MockedStatic<AuthUtils> authUtils = mockStatic(AuthUtils.class)) {
            authUtils.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(bookRepository.findById(999L)).thenReturn(Optional.empty());

            SharedQuoteRequest req = new SharedQuoteRequest("Quote", null, "sunset");
            assertThrows(ResourceNotFoundException.class, () -> quoteService.shareQuote(999L, req));
        }
    }

    @Test
    void getQuotesByBook_returnsQuotes() {
        when(bookRepository.existsById(10L)).thenReturn(true);
        when(quoteRepository.findByBookIdOrderByCreatedAtDesc(10L)).thenReturn(Collections.singletonList(testQuote));

        List<SharedQuoteResponse> res = quoteService.getQuotesByBook(10L);

        assertNotNull(res);
        assertEquals(1, res.size());
        assertEquals(100L, res.get(0).getId());
    }

    @Test
    void getQuotesByBook_bookNotFound_throws() {
        when(bookRepository.existsById(999L)).thenReturn(false);
        assertThrows(ResourceNotFoundException.class, () -> quoteService.getQuotesByBook(999L));
    }
}
