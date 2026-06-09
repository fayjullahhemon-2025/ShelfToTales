package com.example.shelftotales.blog.domain;

import com.example.shelftotales.auth.domain.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blog_posts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BlogPost {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PUBLISHED";

    @Column(name = "views_count", nullable = false)
    @Builder.Default
    private int viewsCount = 0;

    @Column(name = "likes_count", nullable = false)
    @Builder.Default
    private int likesCount = 0;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
