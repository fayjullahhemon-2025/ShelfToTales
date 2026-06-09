package com.example.shelftotales.review.application;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ReviewCommentRequest {
    private Long parentCommentId;
    private String content;
}
