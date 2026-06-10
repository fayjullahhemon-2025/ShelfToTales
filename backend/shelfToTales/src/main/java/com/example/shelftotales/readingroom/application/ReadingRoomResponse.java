package com.example.shelftotales.readingroom.application;
import com.example.shelftotales.auth.application.UserSummaryResponse;
import com.example.shelftotales.readingroom.domain.*;
import com.example.shelftotales.readingroom.infrastructure.*;

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
public class ReadingRoomResponse {
    private Long id;
    private String name;
    private String description;
    private UserSummaryResponse createdBy;
    private LocalDateTime createdAt;
    private Long bookId;
    private String bookTitle;
    private String pdfUrl;
    private boolean previewAvailable;
}
