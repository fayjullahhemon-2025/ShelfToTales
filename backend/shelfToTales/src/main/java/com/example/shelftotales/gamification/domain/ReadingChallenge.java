package com.example.shelftotales.gamification.domain;

import com.example.shelftotales.auth.domain.User;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reading_challenges")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReadingChallenge {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private User creator;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(name = "target_type", nullable = false, length = 20)
    private String targetType;

    @Column(name = "target_value", nullable = false)
    private int targetValue;

    @Column(name = "genre_filter", length = 50)
    private String genreFilter;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
