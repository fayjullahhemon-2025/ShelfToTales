package com.example.shelftotales.social.infrastructure;

import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.auth.domain.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReactionCountRepository extends JpaRepository<ReactionCount, ReactionCount.ReactionCountId> {

    List<ReactionCount> findByTargetTypeAndTargetId(String targetType, Long targetId);

    @Modifying
    @Query(value = "INSERT INTO reaction_counts (target_type, target_id, reaction_type, count) " +
           "VALUES (:targetType, :targetId, :reactionType, 1) " +
           "ON CONFLICT (target_type, target_id, reaction_type) DO UPDATE SET count = reaction_counts.count + 1",
           nativeQuery = true)
    void increment(@Param("targetType") String targetType, @Param("targetId") Long targetId,
                   @Param("reactionType") String reactionType);

    @Modifying
    @Query(value = "UPDATE reaction_counts SET count = GREATEST(count - 1, 0) " +
           "WHERE target_type = :targetType AND target_id = :targetId AND reaction_type = :reactionType",
           nativeQuery = true)
    void decrement(@Param("targetType") String targetType, @Param("targetId") Long targetId,
                   @Param("reactionType") String reactionType);
}
