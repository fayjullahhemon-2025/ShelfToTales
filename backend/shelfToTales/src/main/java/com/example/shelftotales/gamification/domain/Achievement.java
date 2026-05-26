package com.example.shelftotales.gamification.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "achievements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Achievement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(nullable = false, length = 200)
    private String description;

    @Column(length = 100)
    private String icon;

    @Column(name = "criteria_type", nullable = false, length = 30)
    private String criteriaType;

    @Column(name = "criteria_value", nullable = false)
    private int criteriaValue;
}
