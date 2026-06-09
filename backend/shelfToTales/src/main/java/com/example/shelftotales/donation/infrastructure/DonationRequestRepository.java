package com.example.shelftotales.donation.infrastructure;

import com.example.shelftotales.donation.domain.DonationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DonationRequestRepository extends JpaRepository<DonationRequest, Long> {
    List<DonationRequest> findByDonationId(Long donationId);
    List<DonationRequest> findByRecipientId(Long recipientId);
    Optional<DonationRequest> findByDonationIdAndRecipientId(Long donationId, Long recipientId);
}
