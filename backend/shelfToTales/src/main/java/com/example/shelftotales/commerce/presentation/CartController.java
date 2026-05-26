package com.example.shelftotales.commerce.presentation;
import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.application.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.shared.dto.*;
import com.example.shelftotales.auth.application.*;
import com.example.shelftotales.catalog.application.*;
import com.example.shelftotales.bookshelf.application.*;
import com.example.shelftotales.commerce.application.*;
import com.example.shelftotales.social.application.*;
import com.example.shelftotales.readingroom.application.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Authenticated user cart management")
public class CartController {
    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Get current user's cart with items and totals")
    public ResponseEntity<CartResponse> getCart() {
        return ResponseEntity.ok(cartService.getCart());
    }

    @PostMapping("/{bookId}")
    @Operation(summary = "Add book to cart (or increment quantity if already in cart)")
    public ResponseEntity<CartResponse> addToCart(@PathVariable Long bookId,
                                                   @Valid @RequestBody CartItemRequest request) {
        return ResponseEntity.ok(cartService.addToCart(bookId, request.getQuantity()));
    }

    @PutMapping("/{bookId}")
    @Operation(summary = "Update quantity of a cart item")
    public ResponseEntity<CartResponse> updateQuantity(@PathVariable Long bookId,
                                                        @Valid @RequestBody CartItemRequest request) {
        return ResponseEntity.ok(cartService.updateQuantity(bookId, request.getQuantity()));
    }

    @DeleteMapping("/{bookId}")
    @Operation(summary = "Remove book from cart")
    public ResponseEntity<CartResponse> removeFromCart(@PathVariable Long bookId) {
        return ResponseEntity.ok(cartService.removeFromCart(bookId));
    }
}
