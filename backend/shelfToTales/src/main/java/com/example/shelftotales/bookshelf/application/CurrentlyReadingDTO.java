package com.example.shelftotales.bookshelf.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.bookshelf.domain.ReadingStatus;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CurrentlyReadingDTO {
    private Long bookId;
    private String title;
    private String author;
    private String coverUrl;
    private int currentPage;
    private int totalPagesRead;
    private ReadingStatus status;
}
