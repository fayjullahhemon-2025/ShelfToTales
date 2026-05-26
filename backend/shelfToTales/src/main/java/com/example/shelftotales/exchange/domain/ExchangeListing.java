package com.example.shelftotales.exchange.domain;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.catalog.domain.Book;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "exchange_listings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExchangeListing {

    private static final Map<String, Set<String>> VALID_TRANSITIONS = Map.of(
            "AVAILABLE", Set.of("REQUESTED", "CANCELLED"),
            "REQUESTED", Set.of("AVAILABLE", "ACCEPTED", "CANCELLED"),
            "ACCEPTED", Set.of("COMPLETED", "CANCELLED"),
            "COMPLETED", Set.of(),
            "CANCELLED", Set.of()
    );

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(nullable = false, length = 10)
    private String type; // SWAP, DONATE, LEND

    @Column(name = "condition", nullable = false, length = 10)
    private String bookCondition; // LIKE_NEW, GOOD, FAIR, WORN

    @Column(length = 500)
    private String description;

    @Column(nullable = false, length = 100)
    private String location;

    @Column(nullable = false, length = 15)
    @Builder.Default
    private String status = "AVAILABLE";

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public void transitionTo(String newStatus) {
        Set<String> allowed = VALID_TRANSITIONS.get(this.status);
        if (allowed == null || !allowed.contains(newStatus)) {
            throw new IllegalStateException("Cannot transition listing from " + this.status + " to " + newStatus);
        }
        this.status = newStatus;
    }
}
