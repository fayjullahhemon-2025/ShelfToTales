package com.example.shelftotales.ai.presentation;
import com.example.shelftotales.ai.application.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.ai.application.SemanticSearchResponse;
import com.example.shelftotales.catalog.domain.Book;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SemanticSearchController {
    private final EmbeddingService embeddingService;

    @GetMapping("/semantic")
    public ResponseEntity<SemanticSearchResponse> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limit) {
        List<Map.Entry<Book, Double>> results = embeddingService.searchSimilar(q, limit, null);
        List<SemanticSearchResponse.SearchResult> searchResults = results.stream()
                .map(e -> SemanticSearchResponse.SearchResult.builder()
                        .bookId(e.getKey().getId()).title(e.getKey().getTitle())
                        .author(e.getKey().getAuthor()).coverUrl(e.getKey().getCoverUrl())
                        .categoryName(e.getKey().getCategory() != null ? e.getKey().getCategory().getName() : null)
                        .score(e.getValue()).build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(SemanticSearchResponse.builder().query(q).results(searchResults).build());
    }
}
