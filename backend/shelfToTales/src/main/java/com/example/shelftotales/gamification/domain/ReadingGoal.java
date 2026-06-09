package com.example.shelftotales.gamification.domain;

import com.example.shelftotales.auth.domain.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reading_goals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReadingGoal {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "target_year", nullable = false)
    private int targetYear;

    @Column(name = "target_count", nullable = false)
    private int targetCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
