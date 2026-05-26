package com.example.shelftotales.catalog.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "book_embeddings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BookEmbedding {
    @Id
    @Column(name = "book_id")
    private Long bookId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "book_id")
    private Book book;

    @Column(name = "vector_data", nullable = false, columnDefinition = "TEXT")
    private String vectorData;
}
