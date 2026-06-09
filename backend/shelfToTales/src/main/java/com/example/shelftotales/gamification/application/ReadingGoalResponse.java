package com.example.shelftotales.gamification.application;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReadingGoalResponse {
    private Long id;
    private Long userId;
    private int targetYear;
    private int targetCount;
}
