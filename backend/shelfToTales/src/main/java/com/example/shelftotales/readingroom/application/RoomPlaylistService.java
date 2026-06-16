package com.example.shelftotales.readingroom.application;

import com.example.shelftotales.auth.domain.Role;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.readingroom.domain.ReadingRoom;
import com.example.shelftotales.readingroom.domain.RoomPlaylistSong;
import com.example.shelftotales.readingroom.infrastructure.ReadingRoomRepository;
import com.example.shelftotales.readingroom.infrastructure.RoomPlaylistSongRepository;
import com.example.shelftotales.shared.config.StorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class RoomPlaylistService {

    private final RoomPlaylistSongRepository roomPlaylistSongRepository;
    private final ReadingRoomRepository readingRoomRepository;
    private final RoomMemberService roomMemberService;
    private final StorageService storageService;
    private final RoomPlayerStateRegistry playerStateRegistry;
    private final SimpMessagingTemplate messagingTemplate;
    private final S3Client s3Client;

    @Value("${storage.r2.bucket:shelftotales}")
    private String bucket;

    public RoomPlaylistService(RoomPlaylistSongRepository roomPlaylistSongRepository,
                               ReadingRoomRepository readingRoomRepository,
                               RoomMemberService roomMemberService,
                               StorageService storageService,
                               RoomPlayerStateRegistry playerStateRegistry,
                               SimpMessagingTemplate messagingTemplate,
                               @org.springframework.lang.Nullable S3Client s3Client) {
        this.roomPlaylistSongRepository = roomPlaylistSongRepository;
        this.readingRoomRepository = readingRoomRepository;
        this.roomMemberService = roomMemberService;
        this.storageService = storageService;
        this.playerStateRegistry = playerStateRegistry;
        this.messagingTemplate = messagingTemplate;
        this.s3Client = s3Client;
    }

    @Transactional(readOnly = true)
    public List<RoomPlaylistSongResponse> listSongs(Long roomId, User caller) {
        if (!roomMemberService.isMember(roomId, caller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a member of this room");
        }
        return roomPlaylistSongRepository.findByRoomIdOrderBySortOrderAscCreatedAtAsc(roomId)
                .stream()
                .map(RoomPlaylistSongResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public RoomPlaylistSongResponse addSong(Long roomId, MultipartFile file, String title, String artist,
                                            Integer sortOrder, User caller) {
        assertCanManage(roomId, caller);

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Audio file is required");
        }
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Song title is required");
        }

        ReadingRoom room = readingRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + roomId));

        String url;
        try {
            url = storageService.upload(file, "room-playlist");
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Audio storage is not configured. Set R2 credentials on the server.", e);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Audio upload failed: " + e.getMessage(), e);
        }
        RoomPlaylistSong song = RoomPlaylistSong.builder()
                .room(room)
                .title(title)
                .artist(artist)
                .fileUrl(url)
                .sortOrder(sortOrder != null ? sortOrder : 0)
                .addedBy(caller)
                .build();

        RoomPlaylistSong saved = roomPlaylistSongRepository.save(song);
        log.info("Added room playlist song: room={} title={} by {}", roomId, title, caller.getFullName());
        return RoomPlaylistSongResponse.from(saved);
    }

    @Transactional
    public RoomPlaylistSongResponse updateSong(Long roomId, Long songId, PlaylistSongRequest request, User caller) {
        assertCanManage(roomId, caller);

        RoomPlaylistSong song = roomPlaylistSongRepository.findById(songId)
                .orElseThrow(() -> new IllegalArgumentException("Song not found: " + songId));
        if (song.getRoom() == null || !roomId.equals(song.getRoom().getId())) {
            throw new IllegalArgumentException("Song does not belong to this room");
        }

        if (request.getTitle() != null) song.setTitle(request.getTitle());
        if (request.getArtist() != null) song.setArtist(request.getArtist());
        if (request.getSortOrder() != null) song.setSortOrder(request.getSortOrder());

        return RoomPlaylistSongResponse.from(roomPlaylistSongRepository.save(song));
    }

    @Transactional
    public void deleteSong(Long roomId, Long songId, User caller) {
        assertCanManage(roomId, caller);

        RoomPlaylistSong song = roomPlaylistSongRepository.findById(songId)
                .orElseThrow(() -> new IllegalArgumentException("Song not found: " + songId));
        if (song.getRoom() == null || !roomId.equals(song.getRoom().getId())) {
            throw new IllegalArgumentException("Song does not belong to this room");
        }

        roomPlaylistSongRepository.deleteById(songId);

        boolean cleared = playerStateRegistry.clearIfCurrent(roomId, songId);
        if (cleared) {
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/music",
                    Map.of("action", "ended", "trackId", songId, "ts", System.currentTimeMillis()));
        }

        String fileUrl = song.getFileUrl();
        if (fileUrl == null || fileUrl.isBlank()) return;

        String key = extractKey(fileUrl);
        if (key == null) {
            log.warn("Could not extract R2 key from URL, skipping delete: {}", fileUrl);
            return;
        }

        if (s3Client != null) {
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .build());
                log.info("Deleted room playlist file from R2: {}", key);
            } catch (Exception e) {
                log.warn("Failed to delete R2 object for song {}: {}", songId, e.getMessage());
            }
        }
    }

    private void assertCanManage(Long roomId, User caller) {
        boolean isAdmin = caller.getRole() != null && Role.ADMIN.name().equals(caller.getRole().name());
        if (isAdmin) return;
        if (!roomMemberService.isOwner(roomId, caller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the room owner or an admin can manage the playlist");
        }
    }

    private String extractKey(String fileUrl) {
        try {
            URI uri = URI.create(fileUrl);
            String path = uri.getPath();
            if (path == null || path.isBlank() || "/".equals(path)) {
                return null;
            }
            return path.startsWith("/") ? path.substring(1) : path;
        } catch (Exception e) {
            return null;
        }
    }
}
