package com.example.shelftotales.catalog.presentation;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.catalog.application.BookResponse;
import com.example.shelftotales.shared.dto.PagedResponse;
import com.example.shelftotales.catalog.application.ReadBookResponse;
import com.example.shelftotales.catalog.application.BookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@Validated
@Tag(name = "Books", description = "Public book browsing endpoints")
public class BookController {
    private final BookService bookService;

    @GetMapping
    @Operation(summary = "Browse books with pagination, search, and category filter")
    public PagedResponse<BookResponse> getBooks(
            @Parameter(description = "Search by title, author, or ISBN")
            @RequestParam(required = false) String q,
            @Parameter(description = "Filter by category ID")
            @RequestParam(required = false) Long categoryId,
            @Parameter(description = "Minimum price")
            @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price")
            @RequestParam(required = false) BigDecimal maxPrice,
            @Parameter(description = "Only show books with stock greater than zero")
            @RequestParam(defaultValue = "false") boolean inStockOnly,
            @Parameter(description = "Minimum average rating")
            @RequestParam(required = false) Double minRating,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be >= 0") int page,
            @Parameter(description = "Page size (max 100)")
            @RequestParam(defaultValue = "20")
            @Min(value = 1, message = "Size must be >= 1")
            @Max(value = 100, message = "Size must be <= 100") int size,
            @Parameter(description = "Sort field: title, author, publishedDate")
            @RequestParam(defaultValue = "title") String sortBy,
            @Parameter(description = "Sort direction: asc or desc")
            @RequestParam(defaultValue = "asc") String sortDir) {
        return bookService.getBooks(q, categoryId, minPrice, maxPrice, inStockOnly, minRating, page, size, sortBy, sortDir);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get book details by ID")
    public ResponseEntity<BookResponse> getBookById(@PathVariable Long id) {
        return bookService.getBookById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/read")
    @Operation(summary = "Get PDF reading info for a book")
    public ResponseEntity<ReadBookResponse> getReadBookInfo(@PathVariable Long id) {
        return bookService.getReadBookInfo(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/mood/{mood}")
    @Operation(summary = "Get books by mood tag (e.g. cozy, reflective)")
    public ResponseEntity<java.util.List<BookResponse>> getBooksByMood(
            @PathVariable @jakarta.validation.constraints.Size(max = 30) @jakarta.validation.constraints.Pattern(regexp = "^[a-zA-Z]+$") String mood) {
        return ResponseEntity.ok(bookService.getBooksByMood(mood));
    }

    @GetMapping("/{id}/similar")
    @Operation(summary = "Get semantically similar books using vector embeddings")
    public ResponseEntity<java.util.List<BookResponse>> getSimilarBooks(
            @PathVariable Long id,
            @RequestParam(defaultValue = "5") @Min(1) @Max(20) int limit) {
        return ResponseEntity.ok(bookService.findSimilarBooks(id, limit));
    }
}
