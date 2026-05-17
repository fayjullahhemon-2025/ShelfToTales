package com.example.shelftotales.controller;

import com.example.shelftotales.dto.BookResponse;
import com.example.shelftotales.dto.PagedResponse;
import com.example.shelftotales.dto.ReadBookResponse;
import com.example.shelftotales.service.BookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

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
            @Parameter(description = "Search by title or author")
            @RequestParam(required = false) String q,
            @Parameter(description = "Filter by category ID")
            @RequestParam(required = false) Long categoryId,
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
        return bookService.getBooks(q, categoryId, page, size, sortBy, sortDir);
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
}
