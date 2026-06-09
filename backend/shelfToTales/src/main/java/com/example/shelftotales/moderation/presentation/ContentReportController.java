package com.example.shelftotales.moderation.presentation;

import com.example.shelftotales.moderation.application.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ContentReportController {

    private final ContentReportService reportService;

    @PostMapping
    public ResponseEntity<ReportResponseDto> createReport(@RequestBody ReportRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.createReport(dto));
    }
}
