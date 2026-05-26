package com.example.shelftotales.exchange.application;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.exchange.domain.ExchangeCompletedEvent;
import com.example.shelftotales.exchange.domain.ExchangeListing;
import com.example.shelftotales.exchange.domain.ExchangeRequest;
import com.example.shelftotales.exchange.infrastructure.ExchangeListingRepository;
import com.example.shelftotales.exchange.infrastructure.ExchangeRequestRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExchangeRequestService {

    private final ExchangeRequestRepository requestRepository;
    private final ExchangeListingRepository listingRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ExchangeRequest sendRequest(Long listingId, String message, Long offeredBookId) {
        if (message != null && message.length() > 300) {
            throw new IllegalArgumentException("Message must not exceed 300 characters");
        }

        User requester = AuthUtils.getCurrentUser(userRepository);
        ExchangeListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found: " + listingId));

        if (listing.getUser().getId().equals(requester.getId())) {
            throw new IllegalArgumentException("Cannot request your own listing");
        }
        if (!"AVAILABLE".equals(listing.getStatus())) {
            throw new IllegalStateException("Listing is not available");
        }
        if (requestRepository.existsByListingIdAndRequesterId(listingId, requester.getId())) {
            throw new IllegalArgumentException("Already requested this listing");
        }

        Book offeredBook = offeredBookId != null ? bookRepository.findById(offeredBookId).orElse(null) : null;

        ExchangeRequest request = ExchangeRequest.builder()
                .listing(listing).requester(requester)
                .message(message).offeredBook(offeredBook).build();

        listing.transitionTo("REQUESTED");
        listingRepository.save(listing);
        return requestRepository.save(request);
    }

    @Transactional
    public void accept(Long requestId) {
        User lister = AuthUtils.getCurrentUser(userRepository);
        ExchangeRequest request = getRequest(requestId);
        validateListerOwnership(request, lister);

        request.transitionTo("ACCEPTED");
        request.getListing().transitionTo("ACCEPTED");
        listingRepository.save(request.getListing());
        requestRepository.save(request);
    }

    @Transactional
    public void reject(Long requestId) {
        User lister = AuthUtils.getCurrentUser(userRepository);
        ExchangeRequest request = getRequest(requestId);
        validateListerOwnership(request, lister);

        request.transitionTo("REJECTED");
        request.getListing().transitionTo("AVAILABLE"); // Re-open listing
        listingRepository.save(request.getListing());
        requestRepository.save(request);
    }

    @Transactional
    public void complete(Long requestId) {
        User user = AuthUtils.getCurrentUser(userRepository);
        ExchangeRequest request = getRequest(requestId);

        if (!request.getListing().getUser().getId().equals(user.getId())
                && !request.getRequester().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized");
        }

        request.transitionTo("COMPLETED");
        request.getListing().transitionTo("COMPLETED");
        listingRepository.save(request.getListing());
        requestRepository.save(request);

        eventPublisher.publishEvent(new ExchangeCompletedEvent(
                user.getId(), request.getId(),
                request.getListing().getUser().getId(),
                request.getRequester().getId(),
                request.getListing().getType()));
    }

    @Transactional
    public void cancel(Long requestId) {
        User user = AuthUtils.getCurrentUser(userRepository);
        ExchangeRequest request = getRequest(requestId);

        if (!request.getRequester().getId().equals(user.getId())
                && !request.getListing().getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized");
        }

        request.transitionTo("CANCELLED");
        if ("REQUESTED".equals(request.getListing().getStatus()) || "ACCEPTED".equals(request.getListing().getStatus())) {
            request.getListing().transitionTo("AVAILABLE");
            listingRepository.save(request.getListing());
        }
        requestRepository.save(request);
    }

    @Transactional(readOnly = true)
    public Page<ExchangeRequest> getIncoming(Pageable pageable) {
        User user = AuthUtils.getCurrentUser(userRepository);
        return requestRepository.findIncoming(user.getId(), pageable);
    }

    @Transactional(readOnly = true)
    public Page<ExchangeRequest> getOutgoing(Pageable pageable) {
        User user = AuthUtils.getCurrentUser(userRepository);
        return requestRepository.findByRequesterIdOrderByCreatedAtDesc(user.getId(), pageable);
    }

    private ExchangeRequest getRequest(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + id));
    }

    private void validateListerOwnership(ExchangeRequest request, User lister) {
        if (!request.getListing().getUser().getId().equals(lister.getId())) {
            throw new IllegalArgumentException("Not authorized — you are not the listing owner");
        }
    }
}
