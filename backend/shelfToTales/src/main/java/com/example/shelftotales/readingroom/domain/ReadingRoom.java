package com.example.shelftotales.readingroom.domain;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.domain.Category;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reading_rooms")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReadingRoom {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    private LocalDateTime createdAt;

    @Column(name = "book_title", length = 150)
    private String bookTitle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id")
    private Book book;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RoomMessage> messages = new ArrayList<>();

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
