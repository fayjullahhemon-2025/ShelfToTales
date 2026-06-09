package com.example.shelftotales.admin.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "security_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private SecurityEventType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SecurityEventSeverity severity;

    @Column(length = 80)
    private String clientIp;

    @Column(length = 12)
    private String method;

    @Column(length = 300)
    private String path;

    @Column(length = 180)
    private String principal;

    @Column(length = 500)
    private String message;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
