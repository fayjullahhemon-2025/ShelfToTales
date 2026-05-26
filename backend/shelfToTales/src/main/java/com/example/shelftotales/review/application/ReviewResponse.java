package com.example.shelftotales.review.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long bookId;
    private int rating;
    private String comment;
    private boolean isSpoiler;
    private LocalDateTime createdAt;
    private UserSummary user;

    @Getter
    @Setter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserSummary {
        private Long id;
        private String username;
        private String profileImageUrl;
    }
}
