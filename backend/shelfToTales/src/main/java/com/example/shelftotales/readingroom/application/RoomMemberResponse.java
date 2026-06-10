package com.example.shelftotales.readingroom.application;

import com.example.shelftotales.auth.application.UserSummaryResponse;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RoomMemberResponse {
    private Long id;
    private UserSummaryResponse user;
    private String role;
    private LocalDateTime joinedAt;
}
