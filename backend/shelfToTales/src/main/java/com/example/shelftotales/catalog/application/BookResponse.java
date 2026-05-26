package com.example.shelftotales.catalog.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.*;

import java.io.Serializable;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String title;
    private String author;
    private String isbn;
    private String description;
    private String coverUrl;
    private LocalDate publishedDate;
    private String categoryName;
    private Long categoryId;
    private String pdfUrl;
    private boolean previewAvailable;
    private java.math.BigDecimal price;
    private int stock;
    private String moodTags;
}
