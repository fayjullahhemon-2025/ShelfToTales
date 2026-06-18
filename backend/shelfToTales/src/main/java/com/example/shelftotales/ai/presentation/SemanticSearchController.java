package com.example.shelftotales.ai.presentation;

import com.example.shelftotales.ai.application.EmbeddingService;
import com.example.shelftotales.ai.application.UnifiedSearchResponse;
import com.example.shelftotales.ai.application.UnifiedSearchService;
import com.example.shelftotales.ai.application.UnifiedSearchResponse.SearchHit;
import com.example.shelftotales.ai.application.UnifiedSearchResponse.Signals;
import com.example.shelftotales.catalog.application.BookResponse;
import com.example.shelftotales.catalog.application.BookService;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.catalog.infrastructure.ImageHashService;
import com.example.shelftotales.ai.rag.EmbeddingIndexer;
import com.example.shelftotales.shared.dto.ErrorResponse;
import com.example.shelftotales.shared.dto.PagedResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Slf4j
public class SemanticSearchController {

    private static final int MAX_QUERY_LENGTH = 200;
    private static final int MAX_PAGE_SIZE = 100;

    private final EmbeddingService embeddingService;
    private final ImageHashService imageHashService;
    private final BookRepository bookRepository;
    private final JdbcTemplate jdbcTemplate;
    private final EmbeddingIndexer embeddingIndexer;
    private final BookService bookService;
    private final UnifiedSearchService unifiedSearchService;

    // -------- New unified search endpoint --------

    @GetMapping
    public ResponseEntity<?> unified(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size,
            @RequestParam(defaultValue = "title") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        String trimmed = q == null ? "" : q.trim();
        if (trimmed.isEmpty()) {
            return ResponseEntity.badRequest().body(new ErrorResponse(
                    400, "Bad Request", "Query parameter 'q' is required"));
        }
        if (trimmed.length() > MAX_QUERY_LENGTH) {
            return ResponseEntity.badRequest().body(new ErrorResponse(
                    400, "Bad Request", "Query parameter 'q' exceeds " + MAX_QUERY_LENGTH + " characters"));
        }
        if (page < 0) {
            return ResponseEntity.badRequest().body(new ErrorResponse(
                    400, "Bad Request", "page must be >= 0"));
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            return ResponseEntity.badRequest().body(new ErrorResponse(
                    400, "Bad Request", "size must be between 1 and " + MAX_PAGE_SIZE));
        }

        String textStatus = "ok";
        String semanticStatus = "ok";
        List<SearchHit> textHits = List.of();
        List<Map.Entry<Book, Double>> semHits = List.of();

        try {
            PagedResponse<BookResponse> paged = bookService.getBooks(
                    trimmed, null, null, null, false, null, page, size, sortBy, sortDir);
            textHits = paged.getContent().stream()
                    .map(b -> SearchHit.builder()
                            .bookId(b.getId())
                            .title(b.getTitle())
                            .author(b.getAuthor())
                            .coverUrl(b.getCoverUrl())
                            .categoryName(b.getCategoryName())
                            .price(b.getPrice() == null ? null : new BigDecimal(b.getPrice().toString()))
                            .build())
                    .collect(Collectors.toList());
        } catch (RuntimeException e) {
            log.warn("Unified search: text signal failed: {}", e.getMessage());
            textStatus = "degraded";
        }

        try {
            // request a wider semantic window so RRF has room after dedup
            semHits = embeddingService.searchSimilar(trimmed, Math.max(size, 24), null);
        } catch (RuntimeException e) {
            log.warn("Unified search: semantic signal failed: {}", e.getMessage());
            semanticStatus = "degraded";
        }

        if ("degraded".equals(textStatus) && "degraded".equals(semanticStatus)) {
            return ResponseEntity.status(503).body(new ErrorResponse(
                    503, "Service Unavailable", "Search temporarily unavailable"));
        }

        UnifiedSearchResponse resp = unifiedSearchService.merge(trimmed, textHits, semHits, page, size);
        resp.setSignals(Signals.builder().text(textStatus).semantic(semanticStatus).build());
        return ResponseEntity.ok(resp);
    }

    // -------- Existing endpoints (unchanged behaviour) --------

    private boolean isPostgresDatabase() {
        try {
            String dbName = jdbcTemplate.execute((java.sql.Connection conn) -> conn.getMetaData().getDatabaseProductName());
            return "PostgreSQL".equalsIgnoreCase(dbName);
        } catch (Exception e) {
            return false;
        }
    }

    private record BookMatch(Book book, int distance) {}

    @PostMapping("/reindex")
    public ResponseEntity<Map<String, Object>> reindex() {
        int count = embeddingService.reindexAll();
        int chunksIndexed = embeddingIndexer.reindexAll();
        return ResponseEntity.ok(Map.of(
                "indexed", count,
                "chunksIndexed", chunksIndexed,
                "message", "Embeddings generated for " + count + " books and " + chunksIndexed + " RAG chunks"
        ));
    }

    @PostMapping("/image")
    public ResponseEntity<?> searchByImage(@RequestParam("file") MultipartFile file,
                                            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        try {
            long queryHash = imageHashService.computeDHash(file);

            List<BookMatch> matches;
            if (isPostgresDatabase()) {
                List<Book> similarBooks = bookRepository.findSimilarBooksByCoverHashPg(queryHash, limit);
                matches = similarBooks.stream()
                        .map(book -> new BookMatch(book, imageHashService.hammingDistance(queryHash, book.getCoverHash())))
                        .sorted(Comparator.comparingInt(BookMatch::distance))
                        .collect(Collectors.toList());
            } else {
                List<Book> allBooks = bookRepository.findAll();
                matches = allBooks.stream()
                        .filter(book -> book.getCoverHash() != null)
                        .map(book -> new BookMatch(book, imageHashService.hammingDistance(queryHash, book.getCoverHash())))
                        .sorted(Comparator.comparingInt(BookMatch::distance))
                        .limit(limit)
                        .collect(Collectors.toList());
            }

            List<Map<String, Object>> results = matches.stream()
                    .map(match -> {
                        Map<String, Object> result = new HashMap<>();
                        result.put("bookId", match.book().getId());
                        result.put("title", match.book().getTitle());
                        result.put("author", match.book().getAuthor());
                        result.put("coverUrl", match.book().getCoverUrl());
                        result.put("distance", match.distance());
                        return result;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("results", results, "queryHash", queryHash));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to process image: " + e.getMessage()));
        }
    }
}
