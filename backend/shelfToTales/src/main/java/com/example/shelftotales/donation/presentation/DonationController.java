package com.example.shelftotales.donation.presentation;

import com.example.shelftotales.donation.application.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;

    @PostMapping
    public ResponseEntity<DonationResponseDto> createDonation(@RequestBody DonationRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(donationService.createDonation(dto));
    }

    @GetMapping
    public ResponseEntity<Page<DonationResponseDto>> getAvailableDonations(Pageable pageable) {
        return ResponseEntity.ok(donationService.getAvailableDonations(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DonationResponseDto> getDonationDetails(@PathVariable Long id) {
        return ResponseEntity.ok(donationService.getDonationDetails(id));
    }

    @PostMapping("/{id}/request")
    public ResponseEntity<DonationRequestResponseDto> requestDonation(
            @PathVariable Long id, @RequestBody Map<String, String> payload) {
        String reason = payload.getOrDefault("reason", "");
        return ResponseEntity.status(HttpStatus.CREATED).body(donationService.requestDonation(id, reason));
    }

    @GetMapping("/{id}/requests")
    public ResponseEntity<List<DonationRequestResponseDto>> getRequestsForDonation(@PathVariable Long id) {
        return ResponseEntity.ok(donationService.getRequestsForDonation(id));
    }

    @PostMapping("/requests/{requestId}/approve")
    public ResponseEntity<Void> approveRequest(@PathVariable Long requestId) {
        donationService.approveRequest(requestId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-listings")
    public ResponseEntity<List<DonationResponseDto>> getMyListings() {
        return ResponseEntity.ok(donationService.getDonorDonations());
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<DonationRequestResponseDto>> getMyRequests() {
        return ResponseEntity.ok(donationService.getRecipientRequests());
    }
}
