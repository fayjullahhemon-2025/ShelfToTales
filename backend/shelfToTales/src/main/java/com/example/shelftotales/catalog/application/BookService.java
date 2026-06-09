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

import java.util.Optional;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class BookService {
    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;
    private final BookEmbeddingRepository bookEmbeddingRepository;
    private final AIService aiService;
    private final EmbeddingService embeddingService;

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

    @Cacheable(value = "bookById", key = "#id")
    public Optional<BookResponse> getBookById(Long id) {
        return bookRepository.findById(id).map(this::toResponse);
    }

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
        return toResponse(bookRepository.save(book));
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "books", allEntries = true),
        @CacheEvict(value = "bookById", key = "#id")
    })
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
        return toResponse(bookRepository.save(book));
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "books", allEntries = true),
        @CacheEvict(value = "bookById", key = "#id")
    })
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
                .pdfUrl(book.getPdfUrl())
                .previewAvailable(book.isPreviewAvailable())
                .price(book.getPrice())
                .stock(book.getStock())
                .moodTags(book.getMoodTags())
                .build();
    }

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
}
