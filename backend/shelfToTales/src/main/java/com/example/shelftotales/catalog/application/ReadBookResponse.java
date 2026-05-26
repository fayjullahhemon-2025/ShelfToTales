package com.example.shelftotales.catalog.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReadBookResponse {
    private Long id;
    private String title;
    private String author;
    private String pdfUrl;
    private boolean previewAvailable;
    private String coverUrl;
}
