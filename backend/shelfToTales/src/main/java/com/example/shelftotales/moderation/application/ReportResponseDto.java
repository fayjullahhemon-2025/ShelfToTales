package com.example.shelftotales.moderation.application;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponseDto {
    private Long id;
    private Long reporterId;
    private String reporterName;
    private String targetType;
    private Long targetId;
    private String reason;
    private String explanation;
    private String status;
    private String contentPreview;
    private LocalDateTime createdAt;
}
