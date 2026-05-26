package com.example.shelftotales.ai.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
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
