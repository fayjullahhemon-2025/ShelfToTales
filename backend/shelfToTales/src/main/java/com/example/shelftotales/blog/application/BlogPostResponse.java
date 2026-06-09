package com.example.shelftotales.blog.application;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BlogPostResponse {
    private Long id;
    private Long authorId;
    private String authorName;
    private String title;
    private String content;
    private String status;
    private int viewsCount;
    private int likesCount;
    private LocalDateTime createdAt;
}
