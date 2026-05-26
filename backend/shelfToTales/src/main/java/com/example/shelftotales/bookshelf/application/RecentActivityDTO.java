package com.example.shelftotales.bookshelf.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.bookshelf.domain.ActivityType;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecentActivityDTO {
    private ActivityType type;
    private String message;
    private LocalDateTime timestamp;
}
