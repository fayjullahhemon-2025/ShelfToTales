package com.example.shelftotales.admin.application;

import com.example.shelftotales.admin.domain.SecurityEventSeverity;
import com.example.shelftotales.admin.domain.SecurityEventType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SecurityEventResponse {
    private Long id;
    private SecurityEventType type;
    private SecurityEventSeverity severity;
    private String clientIp;
    private String method;
    private String path;
    private String principal;
    private String message;
    private LocalDateTime createdAt;
}
