package com.example.shelftotales.catalog.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Author is required")
    private String author;

    private String isbn;

    private String description;

    private String coverUrl;

    private LocalDate publishedDate;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private String pdfUrl;

    private Boolean previewAvailable;

    private BigDecimal price;

    private Integer stock;

    private String moodTags;
}
