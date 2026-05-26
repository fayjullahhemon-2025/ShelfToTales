package com.example.shelftotales.exchange.domain;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.catalog.domain.Book;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "exchange_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExchangeRequest {

    private static final Map<String, Set<String>> VALID_TRANSITIONS = Map.of(
            "PENDING", Set.of("ACCEPTED", "REJECTED", "CANCELLED"),
            "ACCEPTED", Set.of("COMPLETED", "CANCELLED"),
            "REJECTED", Set.of(),
            "COMPLETED", Set.of(),
            "CANCELLED", Set.of()
    );

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private ExchangeListing listing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @Column(length = 300)
    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offered_book_id")
    private Book offeredBook;

    @Column(nullable = false, length = 15)
    @Builder.Default
    private String status = "PENDING";

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public void transitionTo(String newStatus) {
        Set<String> allowed = VALID_TRANSITIONS.get(this.status);
        if (allowed == null || !allowed.contains(newStatus)) {
            throw new IllegalStateException("Cannot transition request from " + this.status + " to " + newStatus);
        }
        this.status = newStatus;
    }
}
