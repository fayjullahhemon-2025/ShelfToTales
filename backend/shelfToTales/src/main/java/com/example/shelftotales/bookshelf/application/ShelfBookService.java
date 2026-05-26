package com.example.shelftotales.bookshelf.application;

import com.example.shelftotales.bookshelf.application.ShelfBookResponse;
import com.example.shelftotales.event.BookCompletedEvent;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.bookshelf.domain.Bookshelf;
import com.example.shelftotales.bookshelf.domain.ShelfBook;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.bookshelf.infrastructure.BookshelfRepository;
import com.example.shelftotales.bookshelf.infrastructure.ShelfBookRepository;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.bookshelf.application.strategy.ReadingStatusTransitionContext;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShelfBookService {
    private final ShelfBookRepository shelfBookRepository;
    private final BookshelfRepository bookshelfRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final ReadingStatusTransitionContext readingStatusTransitionContext;
    private final ApplicationEventPublisher eventPublisher;

    private Bookshelf getOwnedShelf(Long shelfId) {
        User user = AuthUtils.getCurrentUser(userRepository);
        return bookshelfRepository.findByIdAndUserId(shelfId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Bookshelf not found: " + shelfId));
    }

    @Transactional(readOnly = true)
    public List<ShelfBookResponse> getShelfBooks(Long shelfId) {
        getOwnedShelf(shelfId);
        return shelfBookRepository.findByBookshelfIdWithBook(shelfId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public ShelfBookResponse addBookToShelf(Long shelfId, Long bookId) {
        Bookshelf shelf = getOwnedShelf(shelfId);
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found: " + bookId));

        ShelfBook shelfBook = shelf.addBook(book);
        bookshelfRepository.save(shelf);
        return toResponse(shelfBook);
    }

    @Transactional
    public void removeBookFromShelf(Long shelfId, Long bookId) {
        getOwnedShelf(shelfId);
        ShelfBook shelfBook = shelfBookRepository.findByBookshelfIdAndBookId(shelfId, bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found in this shelf"));
        shelfBookRepository.delete(shelfBook);
    }

    /**
     * Update reading status using Strategy pattern.
     * Validates transition rules via ReadingStatusTransitionContext.
     */
    @Transactional
    public ShelfBookResponse updateReadingStatus(Long shelfId, Long bookId, String newStatus) {
        getOwnedShelf(shelfId);
        ShelfBook shelfBook = shelfBookRepository.findByBookshelfIdAndBookId(shelfId, bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found in this shelf"));

        readingStatusTransitionContext.transition(shelfBook, newStatus);
        ShelfBook saved = shelfBookRepository.save(shelfBook);

        if ("COMPLETED".equals(newStatus)) {
            User user = AuthUtils.getCurrentUser(userRepository);
            Book book = shelfBook.getBook();
            eventPublisher.publishEvent(new BookCompletedEvent(
                    user.getId(), book.getId(), book.getTitle(), book.getCoverUrl(),
                    book.getCategory() != null ? book.getCategory().getId() : null));
        }

        return toResponse(saved);
    }

    private ShelfBookResponse toResponse(ShelfBook shelfBook) {
        return ShelfBookResponse.builder()
                .id(shelfBook.getId()).bookId(shelfBook.getBook().getId())
                .title(shelfBook.getBook().getTitle()).author(shelfBook.getBook().getAuthor())
                .coverUrl(shelfBook.getBook().getCoverUrl())
                .addedAt(shelfBook.getAddedAt()).readingStatus(shelfBook.getReadingStatus())
                .notes(shelfBook.getNotes()).build();
    }
}