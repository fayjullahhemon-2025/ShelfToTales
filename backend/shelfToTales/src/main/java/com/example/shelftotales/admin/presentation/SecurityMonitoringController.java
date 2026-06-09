package com.example.shelftotales.admin.presentation;

import com.example.shelftotales.admin.application.SecurityEventResponse;
import com.example.shelftotales.admin.application.SecurityMonitoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/security")
@RequiredArgsConstructor
public class SecurityMonitoringController {
    private final SecurityMonitoringService securityMonitoringService;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary() {
        return ResponseEntity.ok(securityMonitoringService.getSummary());
    }

    @GetMapping("/events")
    public ResponseEntity<List<SecurityEventResponse>> recentEvents(@RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(securityMonitoringService.getRecentEvents(limit));
    }
}
