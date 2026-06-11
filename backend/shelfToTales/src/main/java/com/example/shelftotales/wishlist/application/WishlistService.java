package com.example.shelftotales.wishlist.application;

import com.example.shelftotales.wishlist.application.WishlistItemResponse;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.event.WishlistAddedEvent;
import com.example.shelftotales.wishlist.domain.WishlistItem;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.wishlist.infrastructure.WishlistRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistService {
    private final WishlistRepository wishlistRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<WishlistItemResponse> getUserWishlist() {
        User user = AuthUtils.getCurrentUser(userRepository);
        return wishlistRepository.findByUserIdWithBook(user.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void addToWishlist(Long bookId) {
        User user = AuthUtils.getCurrentUser(userRepository);
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found: " + bookId));

        try {
            wishlistRepository.save(WishlistItem.builder().user(user).book(book).build());
            eventPublisher.publishEvent(new WishlistAddedEvent(user.getId(), bookId));
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Book already in wishlist");
        }
    }

    @Transactional
    public void removeFromWishlist(Long bookId) {
        User user = AuthUtils.getCurrentUser(userRepository);
        wishlistRepository.deleteByUserIdAndBookId(user.getId(), bookId);
    }

    private WishlistItemResponse toResponse(WishlistItem item) {
        return WishlistItemResponse.builder()
                .id(item.getId())
                .bookId(item.getBook().getId())
                .title(item.getBook().getTitle())
                .author(item.getBook().getAuthor())
                .coverUrl(item.getBook().getCoverUrl())
                .description(item.getBook().getDescription())
                .addedAt(item.getAddedAt())
                .build();
    }
}
