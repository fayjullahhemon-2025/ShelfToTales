package com.example.shelftotales.admin.infrastructure;

import com.example.shelftotales.admin.domain.SecurityEvent;
import com.example.shelftotales.admin.domain.SecurityEventType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {
    List<SecurityEvent> findByOrderByCreatedAtDesc(Pageable pageable);
    long countByTypeAndCreatedAtAfter(SecurityEventType type, LocalDateTime after);
    long countByCreatedAtAfter(LocalDateTime after);
}
