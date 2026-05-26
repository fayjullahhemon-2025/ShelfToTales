package com.example.shelftotales.social.domain;

import com.example.shelftotales.auth.domain.User;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "social_activities")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SocialActivity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String type; // e.g. FOLLOW, REVIEW, CART, ORDER, WISHLIST, BOOKSHELF

    private Long referenceId; // e.g. target userId, reviewId, bookId, orderId

    @Column(nullable = false)
    private String content;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
