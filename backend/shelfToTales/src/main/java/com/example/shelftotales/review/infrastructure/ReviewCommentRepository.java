package com.example.shelftotales.review.infrastructure;

import com.example.shelftotales.review.domain.ReviewComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewCommentRepository extends JpaRepository<ReviewComment, Long> {
    @Query("SELECT rc FROM ReviewComment rc JOIN FETCH rc.user WHERE rc.review.id = :reviewId ORDER BY rc.createdAt ASC")
    List<ReviewComment> findByReviewIdWithUser(@Param("reviewId") Long reviewId);
}
