package com.example.shelftotales.bookshelf.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ShelfBookResponse {
    private Long id;
    private Long bookId;
    private String title;
    private String author;
    private String coverUrl;
    private LocalDateTime addedAt;
    private String readingStatus;
    private String notes;
}
