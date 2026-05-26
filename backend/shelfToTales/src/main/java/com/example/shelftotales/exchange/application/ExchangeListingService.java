package com.example.shelftotales.exchange.application;
import com.example.shelftotales.exchange.domain.*;
import com.example.shelftotales.exchange.infrastructure.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExchangeListingService {

    private final ExchangeListingRepository listingRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    @Transactional
    public ExchangeListing create(Long bookId, String type, String condition, String description, String location) {
        User user = AuthUtils.getCurrentUser(userRepository);
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found: " + bookId));

        ExchangeListing listing = ExchangeListing.builder()
                .user(user).book(book).type(type).bookCondition(condition)
                .description(description).location(location).build();
        return listingRepository.save(listing);
    }

    @Transactional(readOnly = true)
    public Page<ExchangeListing> browse(String type, String location, String condition, Pageable pageable) {
        return listingRepository.browse(type, location, condition, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ExchangeListing> getMyListings(Pageable pageable) {
        User user = AuthUtils.getCurrentUser(userRepository);
        return listingRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
    }

    @Transactional
    public ExchangeListing update(Long id, String type, String condition, String description, String location) {
        ExchangeListing listing = getOwnedListing(id);
        if (!"AVAILABLE".equals(listing.getStatus())) {
            throw new IllegalStateException("Cannot update listing in status: " + listing.getStatus());
        }
        if (type != null) listing.setType(type);
        if (condition != null) listing.setBookCondition(condition);
        if (description != null) listing.setDescription(description);
        if (location != null) listing.setLocation(location);
        return listingRepository.save(listing);
    }

    @Transactional
    public void cancel(Long id) {
        ExchangeListing listing = getOwnedListing(id);
        listing.transitionTo("CANCELLED");
        listingRepository.save(listing);
    }

    private ExchangeListing getOwnedListing(Long id) {
        User user = AuthUtils.getCurrentUser(userRepository);
        ExchangeListing listing = listingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found: " + id));
        if (!listing.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to modify this listing");
        }
        return listing;
    }
}
