package com.example.shelftotales.review.application;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
public class ReviewCommentResponse {
    private Long id;
    private Long reviewId;
    private Long parentCommentId;
    private String content;
    private LocalDateTime createdAt;
    private UserSummary user;
    private List<ReviewCommentResponse> replies;

    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class UserSummary {
        private Long id;
        private String username;
        private String profileImageUrl;
    }
}
