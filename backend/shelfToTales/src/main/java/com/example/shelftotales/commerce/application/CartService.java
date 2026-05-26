package com.example.shelftotales.commerce.application;
import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.infrastructure.*;

import com.example.shelftotales.shared.dto.*;
import com.example.shelftotales.auth.application.*;
import com.example.shelftotales.catalog.application.*;
import com.example.shelftotales.bookshelf.application.*;
import com.example.shelftotales.commerce.application.*;
import com.example.shelftotales.social.application.*;
import com.example.shelftotales.readingroom.application.*;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {
    private final CartItemRepository cartItemRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public CartResponse getCart() {
        User user = AuthUtils.getCurrentUser(userRepository);
        return buildCartResponse(cartItemRepository.findByUserIdWithBook(user.getId()));
    }

    @Transactional
    public CartResponse addToCart(Long bookId, int quantity) {
        User user = AuthUtils.getCurrentUser(userRepository);
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found: " + bookId));

        log.debug("addToCart: userId={}, bookId={}, qty={}", user.getId(), bookId, quantity);

        cartItemRepository.findByUserIdAndBookId(user.getId(), bookId)
                .ifPresentOrElse(
                        item -> {
                            item.addQuantity(quantity);
                            item.validateStockAvailability();
                            cartItemRepository.save(item);
                        },
                        () -> {
                            CartItem newItem = CartItem.builder().user(user).book(book).quantity(0).build();
                            newItem.updateQuantity(quantity);
                            newItem.validateStockAvailability();
                            cartItemRepository.save(newItem);
                        });

        return buildCartResponse(cartItemRepository.findByUserIdWithBook(user.getId()));
    }

    @Transactional
    public CartResponse updateQuantity(Long bookId, int quantity) {
        User user = AuthUtils.getCurrentUser(userRepository);
        CartItem item = cartItemRepository.findByUserIdAndBookId(user.getId(), bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not in cart: " + bookId));

        item.updateQuantity(quantity);
        item.validateStockAvailability();
        cartItemRepository.save(item);
        return buildCartResponse(cartItemRepository.findByUserIdWithBook(user.getId()));
    }

    @Transactional
    public CartResponse removeFromCart(Long bookId) {
        User user = AuthUtils.getCurrentUser(userRepository);
        cartItemRepository.deleteByUserIdAndBookId(user.getId(), bookId);
        return buildCartResponse(cartItemRepository.findByUserIdWithBook(user.getId()));
    }

    private CartResponse buildCartResponse(List<CartItem> items) {
        List<CartItemResponse> itemResponses = items.stream().map(item -> {
            BigDecimal price = item.getBook().getPrice() != null ? item.getBook().getPrice() : BigDecimal.ZERO;
            return CartItemResponse.builder()
                    .id(item.getId()).bookId(item.getBook().getId())
                    .title(item.getBook().getTitle()).author(item.getBook().getAuthor())
                    .coverUrl(item.getBook().getCoverUrl()).quantity(item.getQuantity())
                    .unitPrice(price).subtotal(price.multiply(BigDecimal.valueOf(item.getQuantity())))
                    .build();
        }).collect(Collectors.toList());

        BigDecimal total = itemResponses.stream()
                .map(CartItemResponse::getSubtotal).reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder().items(itemResponses)
                .totalItems(itemResponses.size()).totalPrice(total).build();
    }
}
