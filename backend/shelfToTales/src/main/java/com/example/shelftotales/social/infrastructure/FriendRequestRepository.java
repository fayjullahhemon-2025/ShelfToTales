package com.example.shelftotales.social.infrastructure;

import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.auth.domain.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {
    Optional<FriendRequest> findBySenderIdAndReceiverId(Long senderId, Long receiverId);
    Page<FriendRequest> findByReceiverIdAndStatus(Long receiverId, String status, Pageable pageable);
    boolean existsBySenderIdAndReceiverIdAndStatus(Long senderId, Long receiverId, String status);
}
