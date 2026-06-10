package com.example.shelftotales.donation.application;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationRequestResponseDto {
    private Long id;
    private Long donationId;
    private String donationBookTitle;
    private Long recipientId;
    private String recipientName;
    private String recipientEmail;
    private String donorName;
    private String donorEmail;
    private String reason;
    private String status;
    private LocalDateTime createdAt;
}
