package com.example.shelftotales.readingroom.application;

import com.example.shelftotales.readingroom.domain.RoomPlaylistSong;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RoomPlaylistSongResponse {
    private Long id;
    private Long roomId;
    private String title;
    private String artist;
    private String fileUrl;
    private String coverUrl;
    private Integer durationSeconds;
    private Integer sortOrder;
    private String addedByName;
    private LocalDateTime createdAt;

    public static RoomPlaylistSongResponse from(RoomPlaylistSong song) {
        RoomPlaylistSongResponse r = new RoomPlaylistSongResponse();
        r.setId(song.getId());
        r.setRoomId(song.getRoom() != null ? song.getRoom().getId() : null);
        r.setTitle(song.getTitle());
        r.setArtist(song.getArtist());
        r.setFileUrl(song.getFileUrl());
        r.setCoverUrl(song.getCoverUrl());
        r.setDurationSeconds(song.getDurationSeconds());
        r.setSortOrder(song.getSortOrder());
        r.setAddedByName(song.getAddedBy() != null ? song.getAddedBy().getFullName() : null);
        r.setCreatedAt(song.getCreatedAt());
        return r;
    }
}
