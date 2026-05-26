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
public interface ExchangeListingRepository extends JpaRepository<ExchangeListing, Long> {

    @Query("SELECT l FROM ExchangeListing l WHERE l.status = 'AVAILABLE' " +
           "AND (:type IS NULL OR l.type = :type) " +
           "AND (:location IS NULL OR LOWER(l.location) LIKE LOWER(CONCAT('%', :location, '%'))) " +
           "AND (:condition IS NULL OR l.bookCondition = :condition) " +
           "ORDER BY l.createdAt DESC")
    Page<ExchangeListing> browse(@Param("type") String type,
                                  @Param("location") String location,
                                  @Param("condition") String condition,
                                  Pageable pageable);

    Page<ExchangeListing> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
