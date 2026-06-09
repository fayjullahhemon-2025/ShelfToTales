package com.example.shelftotales.donation.application;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationRequestDto {
    private Long bookId;
    private String customTitle;
    private String customAuthor;
    private String description;
    private String condition;
}
