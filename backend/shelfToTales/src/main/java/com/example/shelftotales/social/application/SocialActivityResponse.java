package com.example.shelftotales.social.application;
import com.example.shelftotales.auth.application.UserSummaryResponse;
import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.social.infrastructure.*;

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
public class SocialActivityResponse {
    private Long id;
    private UserSummaryResponse user;
    private String type;
    private Long referenceId;
    private String content;
    private LocalDateTime createdAt;
}
