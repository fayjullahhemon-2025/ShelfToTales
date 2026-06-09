package com.example.shelftotales.donation.application;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationResponseDto {
    private Long id;
    private Long donorId;
    private String donorName;
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String bookCoverUrl;
    private String customTitle;
    private String customAuthor;
    private String description;
    private String condition;
    private String status;
    private LocalDateTime createdAt;
}
