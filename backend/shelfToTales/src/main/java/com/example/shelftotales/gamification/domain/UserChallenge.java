package com.example.shelftotales.gamification.domain;

import com.example.shelftotales.auth.domain.User;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_challenges")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserChallenge {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_id", nullable = false)
    private ReadingChallenge challenge;

    @Builder.Default
    private int progress = 0;

    @Builder.Default
    private boolean completed = false;

    private LocalDateTime completedAt;
    private LocalDateTime joinedAt;

    @PrePersist
    protected void onCreate() { joinedAt = LocalDateTime.now(); }
}
