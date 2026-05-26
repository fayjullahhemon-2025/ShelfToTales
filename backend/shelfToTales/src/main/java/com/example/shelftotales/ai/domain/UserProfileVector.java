package com.example.shelftotales.ai.domain;

import com.example.shelftotales.auth.domain.User;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_profile_vectors")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserProfileVector {
    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "vector_data", nullable = false, columnDefinition = "TEXT")
    private String vectorData;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist @PreUpdate
    protected void onSave() { updatedAt = LocalDateTime.now(); }
}
