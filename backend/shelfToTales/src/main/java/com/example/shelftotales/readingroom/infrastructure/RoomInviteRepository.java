package com.example.shelftotales.readingroom.infrastructure;

import com.example.shelftotales.readingroom.domain.RoomInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoomInviteRepository extends JpaRepository<RoomInvite, Long> {
    List<RoomInvite> findByInviteeIdAndStatus(Long inviteeId, String status);
    Optional<RoomInvite> findByRoomIdAndInviteeId(Long roomId, Long inviteeId);
    boolean existsByRoomIdAndInviteeIdAndStatus(Long roomId, Long inviteeId, String status);
    List<RoomInvite> findByRoomIdAndStatus(Long roomId, String status);
}
