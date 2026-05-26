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
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    Page<Friendship> findByUserId(Long userId, Pageable pageable);
    boolean existsByUserIdAndFriendId(Long userId, Long friendId);
    void deleteByUserIdAndFriendId(Long userId, Long friendId);
    long countByUserId(Long userId);

    @Query("SELECT f.friend.id FROM Friendship f WHERE f.user.id = :userId")
    List<Long> findFriendIds(@Param("userId") Long userId);
}
