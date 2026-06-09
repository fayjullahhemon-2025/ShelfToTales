package com.example.shelftotales.moderation.infrastructure;

import com.example.shelftotales.moderation.domain.ContentReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContentReportRepository extends JpaRepository<ContentReport, Long> {
    List<ContentReport> findByStatusOrderByCreatedAtDesc(String status);
    Optional<ContentReport> findByReporterIdAndTargetTypeAndTargetId(Long reporterId, String targetType, Long targetId);
}
