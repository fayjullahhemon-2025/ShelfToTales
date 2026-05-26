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

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.exchange.domain.*;
import com.example.shelftotales.exchange.application.*;
import com.example.shelftotales.exchange.infrastructure.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.exchange.domain.*;
import com.example.shelftotales.exchange.application.*;
import com.example.shelftotales.exchange.infrastructure.*;
import com.example.shelftotales.shared.util.AuthUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExchangeListingServiceTest {

    @Mock private ExchangeListingRepository listingRepository;
    @Mock private BookRepository bookRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private ExchangeListingService service;

    @Test
    void create_success() {
        User user = User.builder().id(1L).build();
        Book book = Book.builder().id(42L).title("Test").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(bookRepository.findById(42L)).thenReturn(Optional.of(book));
            when(listingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            ExchangeListing result = service.create(42L, "SWAP", "GOOD", "Nice book", "Dhaka");

            assertEquals("SWAP", result.getType());
            assertEquals("GOOD", result.getBookCondition());
            assertEquals("Dhaka", result.getLocation());
            assertEquals("AVAILABLE", result.getStatus());
        }
    }

    @Test
    void cancel_success() {
        User user = User.builder().id(1L).build();
        ExchangeListing listing = ExchangeListing.builder().id(1L).user(user).status("AVAILABLE").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
            when(listingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            service.cancel(1L);

            assertEquals("CANCELLED", listing.getStatus());
        }
    }

    @Test
    void cancel_notOwner_throws() {
        User user = User.builder().id(1L).build();
        User other = User.builder().id(2L).build();
        ExchangeListing listing = ExchangeListing.builder().id(1L).user(other).status("AVAILABLE").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));

            assertThrows(IllegalArgumentException.class, () -> service.cancel(1L));
        }
    }
}
