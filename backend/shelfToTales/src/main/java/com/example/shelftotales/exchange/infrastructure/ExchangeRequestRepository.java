package com.example.shelftotales.exchange.infrastructure;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.exchange.domain.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ExchangeRequestRepository extends JpaRepository<ExchangeRequest, Long> {

    boolean existsByListingIdAndRequesterId(Long listingId, Long requesterId);

    @Query("SELECT r FROM ExchangeRequest r WHERE r.listing.user.id = :userId ORDER BY r.createdAt DESC")
    Page<ExchangeRequest> findIncoming(@Param("userId") Long userId, Pageable pageable);

    Page<ExchangeRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId, Pageable pageable);
}
