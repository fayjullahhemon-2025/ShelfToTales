package com.example.shelftotales.ai.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatResponse {
    private String reply;
    private List<BookRecommendation> recommendations;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class BookRecommendation {
        private Long bookId;
        private String title;
        private String author;
        private String coverUrl;
        private String reason;
    }
}
