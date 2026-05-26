package com.example.shelftotales.social.infrastructure;

import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.auth.domain.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityFeedItemRepository extends JpaRepository<ActivityFeedItem, Long> {

    @Query("SELECT a FROM ActivityFeedItem a WHERE a.user.id IN :userIds " +
           "AND (a.visibility = 'PUBLIC' OR (a.visibility = 'FRIENDS_ONLY' AND a.user.id IN :friendIds)) " +
           "ORDER BY a.createdAt DESC")
    Page<ActivityFeedItem> findFeedForUser(@Param("userIds") List<Long> userIds,
                                           @Param("friendIds") List<Long> friendIds,
                                           Pageable pageable);

    Page<ActivityFeedItem> findByUserIdAndVisibilityOrderByCreatedAtDesc(Long userId, String visibility, Pageable pageable);

    Page<ActivityFeedItem> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
