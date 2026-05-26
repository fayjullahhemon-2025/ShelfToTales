package com.example.shelftotales.social.application;
import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.social.infrastructure.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FollowResponse {
    private Long userId;
    private String fullName;
    private String profileImageUrl;
    private boolean isFollowingBack;
    private LocalDateTime followedAt;
}
