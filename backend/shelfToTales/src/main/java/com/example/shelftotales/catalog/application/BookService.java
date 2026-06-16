package com.example.shelftotales.catalog.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.catalog.application.BookRequest;
import com.example.shelftotales.catalog.application.BookResponse;
import com.example.shelftotales.shared.dto.PagedResponse;
import com.example.shelftotales.catalog.application.ReadBookResponse;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.domain.Category;
import com.example.shelftotales.catalog.domain.BookEmbedding;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.ai.application.AIService;
import com.example.shelftotales.ai.application.EmbeddingService;
import com.example.shelftotales.catalog.infrastructure.CategoryRepository;
import com.example.shelftotales.catalog.infrastructure.BookEmbeddingRepository;
import com.example.shelftotales.catalog.infrastructure.ImageHashService;
import com.example.shelftotales.commerce.infrastructure.OrderRepository;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.commerce.domain.OrderStatus;
import com.example.shelftotales.auth.domain.Role;
import com.example.shelftotales.auth.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookService {
    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;
    private final BookEmbeddingRepository bookEmbeddingRepository;
    private final AIService aiService;
    private final EmbeddingService embeddingService;
    private final ImageHashService imageHashService;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "books", key = "#query + ':' + #categoryId + ':' + #minPrice + ':' + #maxPrice + ':' + #inStockOnly + ':' + #minRating + ':' + #page + ':' + #size + ':' + #sortBy + ':' + #sortDir")
    public PagedResponse<BookResponse> getBooks(String query, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice, boolean inStockOnly, Double minRating, int page, int size, String sortBy, String sortDir) {
        Sort sort = "desc".equalsIgnoreCase(sortDir) ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Book> bookPage = bookRepository.searchBooks(query, categoryId, minPrice, maxPrice, inStockOnly, minRating, pageable);

        return PagedResponse.<BookResponse>builder()
                .content(bookPage.map(this::toResponse).getContent())
                .page(bookPage.getNumber())
                .size(bookPage.getSize())
                .totalElements(bookPage.getTotalElements())
                .totalPages(bookPage.getTotalPages())
                .last(bookPage.isLast())
                .first(bookPage.isFirst())
                .empty(bookPage.isEmpty())
                .build();
    }

    @Transactional(readOnly = true)
    public Optional<BookResponse> getBookById(Long id) {
        return bookRepository.findById(id).map(book -> {
            BookResponse resp = toResponse(book);
            Long userId = null;
            boolean isAdminOrMod = false;
            try {
                User user = com.example.shelftotales.shared.util.AuthUtils.getCurrentUser(userRepository);
                userId = user.getId();
                isAdminOrMod = user.getRole() == Role.ADMIN || user.getRole() == Role.MODERATOR;
            } catch (Exception e) {}

            if (book.isPreviewAvailable() || isAdminOrMod || (userId != null && canUserReadBook(userId, id))) {
                resp.setPdfUrl(book.getPdfUrl());
            }
            return resp;
        });
    }

    @Transactional(readOnly = true)
    public boolean canUserReadBook(Long userId, Long bookId) {
        Book book = bookRepository.findById(bookId).orElse(null);
        if (book == null) return false;
        if (book.isPreviewAvailable()) return true;
        if (userId == null) return false;
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && (user.getRole() == Role.ADMIN || user.getRole() == Role.MODERATOR)) {
            return true;
        }
        return orderRepository.existsByUserIdAndItemsBookIdAndStatus(userId, bookId, OrderStatus.DELIVERED);
    }

    @Transactional(readOnly = true)
    public List<BookResponse> getPurchasedBooks(Long userId) {
        List<Long> bookIds = orderRepository.findDeliveredBookIdsByUserId(userId);
        List<Book> books = bookRepository.findAllById(bookIds);
        return books.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ReadBookResponse> getReadBookInfo(Long id) {
        return bookRepository.findByIdAndPdfUrlIsNotNull(id).map(book -> ReadBookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .pdfUrl(book.getPdfUrl())
                .previewAvailable(book.isPreviewAvailable())
                .coverUrl(book.getCoverUrl())
                .build());
    }

    @Transactional
    @CacheEvict(value = "books", allEntries = true)
    public BookResponse createBook(BookRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + request.getCategoryId()));

        Book book = Book.builder()
                .title(request.getTitle())
                .author(request.getAuthor())
                .isbn(request.getIsbn())
                .description(request.getDescription())
                .coverUrl(request.getCoverUrl())
                .publishedDate(request.getPublishedDate())
                .pdfUrl(request.getPdfUrl())
                .previewAvailable(request.getPreviewAvailable() != null ? request.getPreviewAvailable() : false)
                .price(request.getPrice())
                .stock(request.getStock() != null ? request.getStock() : 0)
                .category(category)
                .moodTags(request.getMoodTags())
                .build();

        if (request.getCoverUrl() != null && !request.getCoverUrl().isEmpty()) {
            try {
                var hash = imageHashService.computeDHash(new java.net.URL(request.getCoverUrl()));
                book.setCoverHash(hash);
            } catch (Exception e) {
                // Log and continue without hash
            }
        }

        return toResponse(bookRepository.save(book));
    }

    @Transactional
    @CacheEvict(value = "books", allEntries = true)
    public BookResponse updateBook(Long id, BookRequest request) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Book not found: " + id));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + request.getCategoryId()));

        book.setTitle(request.getTitle());
        book.setAuthor(request.getAuthor());
        book.setIsbn(request.getIsbn());
        book.setDescription(request.getDescription());
        book.setCoverUrl(request.getCoverUrl());
        book.setPublishedDate(request.getPublishedDate());
        book.setPdfUrl(request.getPdfUrl());
        book.setPreviewAvailable(request.getPreviewAvailable() != null ? request.getPreviewAvailable() : false);
        book.setPrice(request.getPrice());
        if (request.getStock() != null) {
            book.setStock(request.getStock());
        }
        book.setCategory(category);
        book.setMoodTags(request.getMoodTags());

        if (request.getCoverUrl() != null && !request.getCoverUrl().isEmpty()) {
            try {
                var hash = imageHashService.computeDHash(new java.net.URL(request.getCoverUrl()));
                book.setCoverHash(hash);
            } catch (Exception e) {
                // Log and continue without hash
            }
        }

        return toResponse(bookRepository.save(book));
    }

    @Transactional
    @CacheEvict(value = "books", allEntries = true)
    public void deleteBook(Long id) {
        if (!bookRepository.existsById(id)) {
            throw new IllegalArgumentException("Book not found: " + id);
        }
        bookRepository.deleteById(id);
    }

    private BookResponse toResponse(Book book) {
        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .isbn(book.getIsbn())
                .description(book.getDescription())
                .coverUrl(book.getCoverUrl())
                .publishedDate(book.getPublishedDate())
                .categoryName(book.getCategory() != null ? book.getCategory().getName() : null)
                .categoryId(book.getCategory() != null ? book.getCategory().getId() : null)
                .pdfUrl(null)
                .previewAvailable(book.isPreviewAvailable())
                .price(book.getPrice())
                .stock(book.getStock())
                .moodTags(book.getMoodTags())
                .build();
    }

    @Transactional(readOnly = true)
    public java.util.List<BookResponse> getBooksByMood(String mood) {
        return bookRepository.findByMood(mood).stream()
                .map(this::toResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public java.util.List<BookResponse> findSimilarBooks(Long bookId, int limit) {
        Book targetBook = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found: " + bookId));

        BookEmbedding targetEmbedding = bookEmbeddingRepository.findById(bookId).orElse(null);
        if (targetEmbedding == null) {
            // No embedding yet — fall back to same-category books
            return bookRepository.searchBooks(null,
                    targetBook.getCategory() != null ? targetBook.getCategory().getId() : null,
                    null,
                    null,
                    false,
                    null,
                    PageRequest.of(0, limit))
                    .stream()
                    .filter(b -> !b.getId().equals(bookId))
                    .map(this::toResponse)
                    .collect(java.util.stream.Collectors.toList());
        }

        double[] targetVec = aiService.stringToVector(targetEmbedding.getVectorData());
        java.util.List<Long> similarIds = embeddingService.getSimilarBookIdsExcluding(targetVec, bookId, limit);
        if (similarIds.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        java.util.Map<Long, Book> bookMap = bookRepository.findAllById(similarIds).stream()
                .collect(java.util.stream.Collectors.toMap(Book::getId, java.util.function.Function.identity()));

        return similarIds.stream()
                .map(bookMap::get)
                .filter(java.util.Objects::nonNull)
                .map(this::toResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookResponse> searchByCover(MultipartFile file, int limit) {
        if (file == null || file.isEmpty()) return List.of();
        long hash;
        try {
            hash = imageHashService.computeDHash(file);
        } catch (java.io.IOException e) {
            throw new IllegalArgumentException("Could not read uploaded image");
        }
        // Pgvector path uses bit_count, otherwise fall back to in-memory Hamming over
        // the (small) set of books that have a cover_hash stored.
        List<Book> candidates;
        try {
            candidates = bookRepository.findSimilarBooksByCoverHashPg(hash, limit);
        } catch (RuntimeException pg) {
            List<Book> all = bookRepository.findBooksWithCoverHash();
            candidates = new ArrayList<>(all);
            candidates.sort((a, b) -> Integer.compare(
                    imageHashService.hammingDistance(hash, a.getCoverHash() == null ? 0L : a.getCoverHash()),
                    imageHashService.hammingDistance(hash, b.getCoverHash() == null ? 0L : b.getCoverHash())));
            if (candidates.size() > limit) candidates = candidates.subList(0, limit);
        }
        // Filter out clearly unrelated matches (Hamming distance > 8 for 64-bit dHash).
        return candidates.stream()
                .filter(b -> b.getCoverHash() != null)
                .filter(b -> imageHashService.hammingDistance(hash, b.getCoverHash()) <= 8)
                .map(this::toResponse)
                .collect(java.util.stream.Collectors.toList());
    }
}
