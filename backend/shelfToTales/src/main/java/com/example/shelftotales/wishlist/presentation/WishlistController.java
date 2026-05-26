package com.example.shelftotales.wishlist.presentation;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.wishlist.application.WishlistItemResponse;
import com.example.shelftotales.wishlist.application.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@Tag(name = "Wishlist", description = "Authenticated user wishlist management")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    @Operation(summary = "Get current user's wishlist with book details")
    public ResponseEntity<List<WishlistItemResponse>> getWishlist() {
        return ResponseEntity.ok(wishlistService.getUserWishlist());
    }

    @PostMapping("/{bookId}")
    @Operation(summary = "Add a book to wishlist")
    public ResponseEntity<Void> addToWishlist(@PathVariable Long bookId) {
        wishlistService.addToWishlist(bookId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{bookId}")
    @Operation(summary = "Remove a book from wishlist")
    public ResponseEntity<Void> removeFromWishlist(@PathVariable Long bookId) {
        wishlistService.removeFromWishlist(bookId);
        return ResponseEntity.noContent().build();
    }
}
