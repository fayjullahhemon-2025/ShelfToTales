package com.example.shelftotales.readingroom.infrastructure;

import com.example.shelftotales.readingroom.domain.RoomPlaylistSong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomPlaylistSongRepository extends JpaRepository<RoomPlaylistSong, Long> {
    List<RoomPlaylistSong> findByRoomIdOrderBySortOrderAscCreatedAtAsc(Long roomId);
}
