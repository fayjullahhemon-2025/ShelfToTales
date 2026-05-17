package com.example.shelftotales.controller;

import com.example.shelftotales.dto.*;
import com.example.shelftotales.service.BookshelfService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookshelves")
@RequiredArgsConstructor
@Validated
@Tag(name = "Bookshelves", description = "Authenticated user bookshelf management")
public class BookshelfController {
    private final BookshelfService bookshelfService;

    @GetMapping
    @Operation(summary = "Get all bookshelves for current user, ordered by position")
    public ResponseEntity<List<BookshelfResponse>> getBookshelves() {
        return ResponseEntity.ok(bookshelfService.getUserBookshelves());
    }

    @PostMapping
    @Operation(summary = "Create a new bookshelf")
    public ResponseEntity<BookshelfResponse> createBookshelf(@Valid @RequestBody BookshelfRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(bookshelfService.createBookshelf(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Rename a bookshelf")
    public ResponseEntity<BookshelfResponse> updateBookshelf(@PathVariable Long id,
                                                              @Valid @RequestBody BookshelfRequest request) {
        return ResponseEntity.ok(bookshelfService.updateBookshelf(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a bookshelf")
    public ResponseEntity<Void> deleteBookshelf(@PathVariable Long id) {
        bookshelfService.deleteBookshelf(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reorder")
    @Operation(summary = "Reorder bookshelves by providing ordered shelf IDs")
    public ResponseEntity<Void> reorder(
            @RequestBody @NotEmpty(message = "Shelf IDs list cannot be empty")
            @Size(max = 100, message = "Cannot reorder more than 100 shelves at once")
            List<Long> shelfIds) {
        bookshelfService.reorder(shelfIds);
        return ResponseEntity.ok().build();
    }
}
