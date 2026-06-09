package com.example.shelftotales.admin.application;

import com.example.shelftotales.admin.domain.SecurityEvent;
import com.example.shelftotales.admin.domain.SecurityEventSeverity;
import com.example.shelftotales.admin.domain.SecurityEventType;
import com.example.shelftotales.admin.infrastructure.SecurityEventRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SecurityMonitoringService {
    private final SecurityEventRepository securityEventRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(SecurityEventType type, SecurityEventSeverity severity, HttpServletRequest request, String principal, String message) {
        securityEventRepository.save(SecurityEvent.builder()
                .type(type)
                .severity(severity)
                .clientIp(clientIp(request))
                .method(request.getMethod())
                .path(request.getRequestURI())
                .principal(principal)
                .message(message)
                .build());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSummary() {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("eventsLast24h", securityEventRepository.countByCreatedAtAfter(since));
        summary.put("rateLimitsLast24h", securityEventRepository.countByTypeAndCreatedAtAfter(SecurityEventType.RATE_LIMIT_EXCEEDED, since));
        summary.put("blacklistedTokensLast24h", securityEventRepository.countByTypeAndCreatedAtAfter(SecurityEventType.BLACKLISTED_TOKEN_USED, since));
        summary.put("jwtFailuresLast24h", securityEventRepository.countByTypeAndCreatedAtAfter(SecurityEventType.JWT_AUTHENTICATION_FAILED, since));
        return summary;
    }

    @Transactional(readOnly = true)
    public List<SecurityEventResponse> getRecentEvents(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return securityEventRepository.findByOrderByCreatedAtDesc(PageRequest.of(0, safeLimit)).stream()
                .map(this::toResponse)
                .toList();
    }

    private SecurityEventResponse toResponse(SecurityEvent event) {
        return SecurityEventResponse.builder()
                .id(event.getId())
                .type(event.getType())
                .severity(event.getSeverity())
                .clientIp(event.getClientIp())
                .method(event.getMethod())
                .path(event.getPath())
                .principal(event.getPrincipal())
                .message(event.getMessage())
                .createdAt(event.getCreatedAt())
                .build();
    }

    private static String clientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}
