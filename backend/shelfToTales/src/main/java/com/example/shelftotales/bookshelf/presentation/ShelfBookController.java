package com.example.shelftotales.bookshelf.presentation;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.bookshelf.application.ShelfBookResponse;
import com.example.shelftotales.bookshelf.application.ShelfBookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookshelves/{shelfId}/books")
@RequiredArgsConstructor
@Tag(name = "Shelf Books", description = "Manage books inside user's bookshelves")
public class ShelfBookController {
    private final ShelfBookService shelfBookService;

    @GetMapping
    @Operation(summary = "Get all books in a shelf")
    public ResponseEntity<List<ShelfBookResponse>> getShelfBooks(@PathVariable Long shelfId) {
        return ResponseEntity.ok(shelfBookService.getShelfBooks(shelfId));
    }

    @PostMapping("/{bookId}")
    @Operation(summary = "Add a book to a shelf")
    public ResponseEntity<ShelfBookResponse> addBookToShelf(@PathVariable Long shelfId, @PathVariable Long bookId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shelfBookService.addBookToShelf(shelfId, bookId));
    }

    @DeleteMapping("/{bookId}")
    @Operation(summary = "Remove a book from a shelf")
    public ResponseEntity<Void> removeBookFromShelf(@PathVariable Long shelfId, @PathVariable Long bookId) {
        shelfBookService.removeBookFromShelf(shelfId, bookId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{bookId}/status")
    @Operation(summary = "Update reading status of a book on a shelf")
    public ResponseEntity<ShelfBookResponse> updateReadingStatus(
            @PathVariable Long shelfId,
            @PathVariable Long bookId,
            @RequestParam String status) {
        return ResponseEntity.ok(shelfBookService.updateReadingStatus(shelfId, bookId, status));
    }
}
