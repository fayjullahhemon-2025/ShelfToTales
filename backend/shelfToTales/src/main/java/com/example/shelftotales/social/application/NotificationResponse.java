package com.example.shelftotales.social.application;
import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.social.infrastructure.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationResponse {
    private Long id;
    private String type;
    private Long actorId;
    private String actorName;
    private String actorAvatar;
    private String referenceType;
    private Long referenceId;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
}
