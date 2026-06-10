package com.example.shelftotales.catalog.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    @Column(unique = true)
    private String isbn;

    @Column(length = 1000)
    private String description;

    private String coverUrl;

    private LocalDate publishedDate;

    private String pdfUrl;

    @Column(nullable = false)
    @Builder.Default
    private boolean previewAvailable = false;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    @Builder.Default
    private int stock = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @JsonIgnoreProperties("books")
    private Category category;

    @Column(name = "mood_tags")
    private String moodTags;

    @Column(name = "cover_hash")
    private Long coverHash;

    @Version
    private Long version;
}
