package com.example.shelftotales.exchange.infrastructure;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.exchange.domain.*;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExchangeRatingRepository extends JpaRepository<ExchangeRating, Long> {

    boolean existsByExchangeRequestIdAndRaterId(Long exchangeRequestId, Long raterId);

    List<ExchangeRating> findByRateeIdOrderByCreatedAtDesc(Long rateeId);

    @Query("SELECT AVG(r.score) FROM ExchangeRating r WHERE r.ratee.id = :userId")
    Double findAverageScoreByRateeId(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM ExchangeRating r WHERE r.ratee.id = :userId")
    long countByRateeId(@Param("userId") Long userId);
}
