package com.example.shelftotales.moderation.presentation;

import com.example.shelftotales.moderation.application.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
@RequiredArgsConstructor
public class AdminReportController {

    private final ContentReportService reportService;

    @GetMapping
    public ResponseEntity<List<ReportResponseDto>> getPendingReports() {
        return ResponseEntity.ok(reportService.getPendingReports());
    }

    @PostMapping("/{id}/dismiss")
    public ResponseEntity<Void> dismissReport(@PathVariable Long id) {
        reportService.dismissReport(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/action")
    public ResponseEntity<Void> actionReport(@PathVariable Long id) {
        reportService.actionReport(id);
        return ResponseEntity.noContent().build();
    }
}
