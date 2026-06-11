package com.example.shelftotales.bookshelf.application;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecommendedBookDTO {
    private Long bookId;
    private String title;
    private String author;
    private String coverUrl;
    private double score;
    private String reason;
    private String matchCategory;
}
