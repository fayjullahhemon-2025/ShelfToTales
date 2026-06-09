package com.example.shelftotales.gamification.application;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReadingGoalRequest {
    private int targetYear;
    private int targetCount;
}
