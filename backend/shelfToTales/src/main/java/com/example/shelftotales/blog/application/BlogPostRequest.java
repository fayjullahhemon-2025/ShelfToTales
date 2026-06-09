package com.example.shelftotales.blog.application;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BlogPostRequest {
    private String title;
    private String content;
    private String status;
}
