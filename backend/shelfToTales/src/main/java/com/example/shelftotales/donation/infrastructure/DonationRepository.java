package com.example.shelftotales.donation.infrastructure;

import com.example.shelftotales.donation.domain.Donation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Long> {
    @Query("SELECT d FROM Donation d LEFT JOIN FETCH d.book WHERE d.status = 'AVAILABLE' AND d.donor.id <> :userId")
    Page<Donation> findAvailableDonations(@Param("userId") Long userId, Pageable pageable);

    List<Donation> findByDonorId(Long donorId);
}
