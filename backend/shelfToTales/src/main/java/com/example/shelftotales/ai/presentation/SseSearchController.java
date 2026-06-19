package com.example.shelftotales.ai.presentation;

import com.example.shelftotales.ai.application.EmbeddingService;
import com.example.shelftotales.ai.application.UnifiedSearchResponse.SearchHit;
import com.example.shelftotales.ai.application.UnifiedSearchService;
import com.example.shelftotales.catalog.application.BookResponse;
import com.example.shelftotales.catalog.application.BookService;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.shared.dto.ErrorResponse;
import com.example.shelftotales.shared.dto.PagedResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search/stream")
@RequiredArgsConstructor
@Slf4j
public class SseSearchController {

    private static final long EMITTER_TIMEOUT_MS = 30_000L;

    private final BookService bookService;
    private final EmbeddingService embeddingService;
    private final UnifiedSearchService unifiedSearchService;

    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size,
            @RequestParam(defaultValue = "title") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        String trimmed = q == null ? "" : q.trim();
        if (trimmed.isEmpty()) {
            sendEvent(emitter, "error", Map.of("message", "Query parameter 'q' is required"));
            emitter.complete();
            return emitter;
        }

        // Text signal
        CompletableFuture<List<SearchHit>> textFuture = CompletableFuture.supplyAsync(() -> {
            try {
                PagedResponse<BookResponse> paged = bookService.getBooks(
                        trimmed, null, null, null, false, null, page, size, sortBy, sortDir);
                return paged.getContent().stream()
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
                log.warn("SSE: text signal failed: {}", e.getMessage());
                return null;
            }
        });

        // Semantic signal
        CompletableFuture<List<Map.Entry<Book, Double>>> semFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return embeddingService.searchSimilar(trimmed, Math.max(size, 24), null);
            } catch (RuntimeException e) {
                log.warn("SSE: semantic signal failed: {}", e.getMessage());
                return null;
            }
        });

        // Emit text result when ready
        textFuture.whenComplete((textHits, err) -> {
            if (textHits != null) {
                sendEvent(emitter, "text", textHits);
            } else {
                sendEvent(emitter, "text-degraded", Map.of());
            }
        });

        // Emit semantic result when ready
        semFuture.whenComplete((semHits, err) -> {
            if (semHits != null) {
                sendEvent(emitter, "semantic", semHits);
            } else {
                sendEvent(emitter, "semantic-degraded", Map.of());
            }
        });

        // When both done, emit done event
        CompletableFuture.allOf(textFuture, semFuture).whenComplete((v, err) -> {
            try {
                List<SearchHit> finalText = textFuture.join();
                List<Map.Entry<Book, Double>> finalSem = semFuture.join();
                if (finalText == null && finalSem == null) {
                    sendEvent(emitter, "error", Map.of("message", "Search temporarily unavailable"));
                } else {
                    sendEvent(emitter, "done", Map.of("personalized", false, "imageMatched", false));
                }
            } finally {
                emitter.complete();
            }
        });

        return emitter;
    }

    private void sendEvent(SseEmitter emitter, String name, Object data) {
        try {
            emitter.send(SseEmitter.event().name(name).data(data));
        } catch (IOException e) {
            emitter.completeWithError(e);
        }
    }
}
