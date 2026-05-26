package com.example.shelftotales.social.domain;

import com.example.shelftotales.auth.domain.User;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_feed_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ActivityFeedItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "activity_type", nullable = false, length = 30)
    private String activityType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "reference_type", length = 30)
    private String referenceType;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String visibility = "PUBLIC";

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
