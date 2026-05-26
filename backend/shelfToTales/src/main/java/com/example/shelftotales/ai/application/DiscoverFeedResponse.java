package com.example.shelftotales.ai.application;
import com.example.shelftotales.catalog.application.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DiscoverFeedResponse {
    private List<RecommendedBook> forYou;
    private TrendingSection trending;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RecommendedBook {
        private Long bookId;
        private String title;
        private String author;
        private String coverUrl;
        private double score;
        private String reason;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TrendingSection {
        private List<BookResponse> mostRead;
        private List<BookResponse> topReviewed;
    }
}
