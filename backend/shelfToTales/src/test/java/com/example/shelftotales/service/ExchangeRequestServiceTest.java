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
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExchangeRequestServiceTest {

    @Mock private ExchangeRequestRepository requestRepository;
    @Mock private ExchangeListingRepository listingRepository;
    @Mock private BookRepository bookRepository;
    @Mock private UserRepository userRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @InjectMocks private ExchangeRequestService service;

    @Test
    void sendRequest_success() {
        User requester = User.builder().id(2L).build();
        User lister = User.builder().id(1L).build();
        ExchangeListing listing = ExchangeListing.builder().id(1L).user(lister).status("AVAILABLE").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(requester);
            when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
            when(requestRepository.existsByListingIdAndRequesterId(1L, 2L)).thenReturn(false);
            when(requestRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(listingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            ExchangeRequest result = service.sendRequest(1L, "I want this!", null);

            assertEquals("PENDING", result.getStatus());
            assertEquals("REQUESTED", listing.getStatus());
        }
    }

    @Test
    void sendRequest_ownListing_throws() {
        User user = User.builder().id(1L).build();
        ExchangeListing listing = ExchangeListing.builder().id(1L).user(user).status("AVAILABLE").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));

            assertThrows(IllegalArgumentException.class, () -> service.sendRequest(1L, "msg", null));
        }
    }

    @Test
    void accept_success() {
        User lister = User.builder().id(1L).build();
        ExchangeListing listing = ExchangeListing.builder().id(1L).user(lister).status("REQUESTED").build();
        ExchangeRequest request = ExchangeRequest.builder().id(10L).listing(listing).status("PENDING").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(lister);
            when(requestRepository.findById(10L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(listingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            service.accept(10L);

            assertEquals("ACCEPTED", request.getStatus());
            assertEquals("ACCEPTED", listing.getStatus());
        }
    }

    @Test
    void complete_success() {
        User lister = User.builder().id(1L).build();
        ExchangeListing listing = ExchangeListing.builder().id(1L).user(lister).status("ACCEPTED").build();
        ExchangeRequest request = ExchangeRequest.builder().id(10L).listing(listing)
                .requester(User.builder().id(2L).build()).status("ACCEPTED").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(lister);
            when(requestRepository.findById(10L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(listingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            service.complete(10L);

            assertEquals("COMPLETED", request.getStatus());
            assertEquals("COMPLETED", listing.getStatus());
        }
    }
}
