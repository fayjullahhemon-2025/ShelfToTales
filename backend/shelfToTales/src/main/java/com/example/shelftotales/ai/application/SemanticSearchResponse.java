package com.example.shelftotales.ai.application;

import lombok.*;

import java.util.List;

/** @deprecated Use {@link UnifiedSearchResponse}. Retained for one release for the /api/search/semantic shim. */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Deprecated
public class SemanticSearchResponse {
    private String query;
    private List<SearchResult> results;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SearchResult {
        private Long bookId;
        private String title;
        private String author;
        private String coverUrl;
        private String categoryName;
        private double score;
    }
}
