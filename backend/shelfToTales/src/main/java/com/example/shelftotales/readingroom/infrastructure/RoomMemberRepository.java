package com.example.shelftotales.readingroom.infrastructure;

import com.example.shelftotales.readingroom.domain.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {
    List<RoomMember> findByRoomId(Long roomId);
    Optional<RoomMember> findByRoomIdAndUserId(Long roomId, Long userId);
    boolean existsByRoomIdAndUserId(Long roomId, Long userId);
    void deleteByRoomIdAndUserId(Long roomId, Long userId);
    long countByRoomId(Long roomId);
}
