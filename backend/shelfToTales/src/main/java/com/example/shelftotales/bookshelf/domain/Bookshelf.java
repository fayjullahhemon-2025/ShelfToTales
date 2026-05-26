package com.example.shelftotales.bookshelf.domain;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.domain.Category;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookshelves")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bookshelf {
    private static final int MAX_BOOKS_PER_SHELF = 200;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false)
    @Builder.Default
    private String theme = "glass";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "bookshelf", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ShelfBook> books = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ─── Domain Logic ───────────────────────────────────────────────

    /**
     * Add book to shelf. Prevents duplicates and enforces max size.
     */
    public ShelfBook addBook(Book book) {
        if (containsBook(book.getId())) {
            throw new IllegalStateException("Book '" + book.getTitle() + "' is already on this shelf");
        }
        if (books.size() >= MAX_BOOKS_PER_SHELF) {
            throw new IllegalStateException("Shelf cannot exceed " + MAX_BOOKS_PER_SHELF + " books");
        }

        ShelfBook shelfBook = ShelfBook.builder()
                .bookshelf(this)
                .book(book)
                .readingStatus("NOT_STARTED")
                .build();
        books.add(shelfBook);
        return shelfBook;
    }

    /**
     * Remove book from shelf.
     */
    public void removeBook(Long bookId) {
        boolean removed = books.removeIf(sb -> sb.getBook().getId().equals(bookId));
        if (!removed) {
            throw new IllegalArgumentException("Book not found on this shelf");
        }
    }

    /**
     * Check if shelf already contains a book.
     */
    public boolean containsBook(Long bookId) {
        return books.stream().anyMatch(sb -> sb.getBook().getId().equals(bookId));
    }

    public int getBookCount() {
        return books.size();
    }
}
