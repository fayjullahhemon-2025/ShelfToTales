package com.example.shelftotales.readingroom.application;

import com.example.shelftotales.auth.application.UserSummaryResponse;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RoomInviteResponse {
    private Long id;
    private Long roomId;
    private String roomName;
    private UserSummaryResponse inviter;
    private UserSummaryResponse invitee;
    private String status;
    private LocalDateTime createdAt;
}
