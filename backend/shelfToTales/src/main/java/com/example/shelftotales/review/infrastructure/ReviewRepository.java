package com.example.shelftotales.review.infrastructure;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.review.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByBookIdOrderByCreatedAtDesc(Long bookId);
    Optional<Review> findByBookIdAndUserId(Long bookId, Long userId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.book.id = :bookId")
    Double findAverageRatingByBookId(Long bookId);

    long countByUserId(Long userId);

    List<Review> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT r.book.id FROM Review r " +
           "GROUP BY r.book.id " +
           "ORDER BY AVG(r.rating) DESC, COUNT(r) DESC")
    java.util.List<Long> findTopReviewedBookIds(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT r.book.id FROM Review r WHERE r.user.id = :userId")
    List<Long> findBookIdsByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);

    @Query("SELECT r.user.id FROM Review r WHERE r.book.id = :bookId")
    List<Long> findUserIdsByBookId(@org.springframework.data.repository.query.Param("bookId") Long bookId);

    List<Review> findByBookId(Long bookId);

    long countByBookIdAndSpoilerLevelIsNotNull(Long bookId);

    List<Review> findByUserIdAndRatingGreaterThanEqualAndCreatedAtAfter(
            Long userId, int minRating, java.time.Instant after);
}
