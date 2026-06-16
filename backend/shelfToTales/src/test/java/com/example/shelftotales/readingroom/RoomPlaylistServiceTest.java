package com.example.shelftotales.readingroom;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.readingroom.application.PlaylistSongRequest;
import com.example.shelftotales.readingroom.application.RoomMemberService;
import com.example.shelftotales.readingroom.application.RoomPlayerStateRegistry;
import com.example.shelftotales.readingroom.application.RoomPlaylistService;
import com.example.shelftotales.readingroom.application.RoomPlaylistSongResponse;
import com.example.shelftotales.readingroom.domain.ReadingRoom;
import com.example.shelftotales.readingroom.domain.RoomPlaylistSong;
import com.example.shelftotales.readingroom.infrastructure.ReadingRoomRepository;
import com.example.shelftotales.readingroom.infrastructure.RoomPlaylistSongRepository;
import com.example.shelftotales.shared.config.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.S3Client;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoomPlaylistServiceTest {

    @Mock private RoomPlaylistSongRepository songRepository;
    @Mock private ReadingRoomRepository roomRepository;
    @Mock private RoomMemberService memberService;
    @Mock private StorageService storageService;
    @Mock private RoomPlayerStateRegistry registry;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private S3Client s3Client;

    @InjectMocks
    private RoomPlaylistService service;

    private User owner;
    private User nonMember;
    private MockMultipartFile audio;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L).email("owner@example.com").fullName("Owner")
                .role(com.example.shelftotales.auth.domain.Role.USER)
                .following(new java.util.HashSet<>())
                .followers(new java.util.HashSet<>())
                .build();
        nonMember = User.builder()
                .id(2L).email("non@example.com").fullName("Non")
                .role(com.example.shelftotales.auth.domain.Role.USER)
                .following(new java.util.HashSet<>())
                .followers(new java.util.HashSet<>())
                .build();
        audio = new MockMultipartFile("file", "song.mp3", "audio/mpeg", "data".getBytes());
    }

    @Test
    void listSongs_returnsOrderedListForMember() {
        ReadingRoom room = ReadingRoom.builder().id(10L).name("R").build();
        RoomPlaylistSong song = RoomPlaylistSong.builder()
                .id(1L).room(room).title("T").fileUrl("room-playlist/a.mp3")
                .sortOrder(0).addedBy(owner).build();
        when(memberService.isMember(10L, owner.getId())).thenReturn(true);
        when(songRepository.findByRoomIdOrderBySortOrderAscCreatedAtAsc(10L)).thenReturn(List.of(song));

        List<RoomPlaylistSongResponse> result = service.listSongs(10L, owner);

        assertEquals(1, result.size());
        assertEquals("T", result.get(0).getTitle());
    }

    @Test
    void listSongs_rejectsNonMember() {
        when(memberService.isMember(10L, nonMember.getId())).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.listSongs(10L, nonMember));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void addSong_uploadsAndPersists() {
        when(memberService.isOwner(10L, owner.getId())).thenReturn(true);
        when(storageService.upload(any(), eq("room-playlist"))).thenReturn("room-playlist/abc.mp3");
        when(roomRepository.findById(10L)).thenReturn(Optional.of(ReadingRoom.builder().id(10L).build()));
        when(songRepository.save(any(RoomPlaylistSong.class))).thenAnswer(inv -> {
            RoomPlaylistSong s = inv.getArgument(0);
            s.setId(99L);
            return s;
        });

        RoomPlaylistSongResponse resp = service.addSong(10L, audio, "Title", "Artist", 2, owner);

        assertNotNull(resp);
        assertEquals(99L, resp.getId());
        assertEquals("Title", resp.getTitle());
        verify(storageService).upload(audio, "room-playlist");
        verify(songRepository).save(any(RoomPlaylistSong.class));
    }

    @Test
    void addSong_mapsStorageUnavailableTo503() {
        when(memberService.isOwner(10L, owner.getId())).thenReturn(true);
        when(roomRepository.findById(10L)).thenReturn(Optional.of(ReadingRoom.builder().id(10L).build()));
        when(storageService.upload(any(), anyString()))
                .thenThrow(new IllegalStateException("Storage not configured"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.addSong(10L, audio, "T", "A", 0, owner));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatusCode());
        verifyNoInteractions(songRepository);
    }

    @Test
    void addSong_rejectsNonOwnerNonAdmin() {
        when(memberService.isOwner(10L, owner.getId())).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.addSong(10L, audio, "T", "A", 0, owner));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void addSong_allowsAdmin() {
        User admin = User.builder()
                .id(3L).email("admin@example.com").fullName("Admin")
                .role(com.example.shelftotales.auth.domain.Role.ADMIN)
                .following(new java.util.HashSet<>())
                .followers(new java.util.HashSet<>())
                .build();
        when(storageService.upload(any(), anyString())).thenReturn("room-playlist/x.mp3");
        when(roomRepository.findById(10L)).thenReturn(Optional.of(ReadingRoom.builder().id(10L).build()));
        when(songRepository.save(any(RoomPlaylistSong.class))).thenAnswer(inv -> inv.getArgument(0));

        RoomPlaylistSongResponse resp = service.addSong(10L, audio, "T", null, null, admin);

        assertNotNull(resp);
        verify(memberService, never()).isOwner(anyLong(), any());
    }

    @Test
    void deleteSong_broadcastsEndedWhenCurrentlyPlaying() {
        ReadingRoom room = ReadingRoom.builder().id(10L).name("R").build();
        RoomPlaylistSong song = RoomPlaylistSong.builder()
                .id(55L).room(room).title("X").fileUrl("https://pub/room-playlist/a.mp3")
                .sortOrder(0).addedBy(owner).build();
        when(memberService.isOwner(10L, owner.getId())).thenReturn(true);
        when(songRepository.findById(55L)).thenReturn(Optional.of(song));
        when(registry.clearIfCurrent(10L, 55L)).thenReturn(true);

        service.deleteSong(10L, 55L, owner);

        verify(registry).clearIfCurrent(10L, 55L);
        verify(messagingTemplate).convertAndSend(eq("/topic/room/10/music"), any(Object.class));
        verify(s3Client).deleteObject(any(software.amazon.awssdk.services.s3.model.DeleteObjectRequest.class));
    }

    @Test
    void deleteSong_doesNotBroadcastWhenNotCurrent() {
        ReadingRoom room = ReadingRoom.builder().id(10L).build();
        RoomPlaylistSong song = RoomPlaylistSong.builder()
                .id(55L).room(room).title("X").fileUrl(null).build();
        when(memberService.isOwner(10L, owner.getId())).thenReturn(true);
        when(songRepository.findById(55L)).thenReturn(Optional.of(song));
        when(registry.clearIfCurrent(10L, 55L)).thenReturn(false);

        service.deleteSong(10L, 55L, owner);

        verifyNoInteractions(messagingTemplate);
        verifyNoInteractions(s3Client);
    }

    @Test
    void deleteSong_rejectsWhenSongFromDifferentRoom() {
        ReadingRoom other = ReadingRoom.builder().id(99L).build();
        RoomPlaylistSong song = RoomPlaylistSong.builder().id(55L).room(other).build();
        when(memberService.isOwner(10L, owner.getId())).thenReturn(true);
        when(songRepository.findById(55L)).thenReturn(Optional.of(song));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.deleteSong(10L, 55L, owner));
        assertEquals("Song does not belong to this room", ex.getMessage());
    }
}
