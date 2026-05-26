package com.example.shelftotales.social.infrastructure;

import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.auth.domain.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {
    Optional<Reaction> findByUserIdAndTargetTypeAndTargetIdAndReactionType(
            Long userId, String targetType, Long targetId, String reactionType);
    List<Reaction> findByTargetTypeAndTargetId(String targetType, Long targetId);
    boolean existsByUserIdAndTargetTypeAndTargetIdAndReactionType(
            Long userId, String targetType, Long targetId, String reactionType);
}
