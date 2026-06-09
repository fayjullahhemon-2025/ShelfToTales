package com.example.shelftotales.moderation.application;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportRequestDto {
    private String targetType;
    private Long targetId;
    private String reason;
    private String explanation;
}
