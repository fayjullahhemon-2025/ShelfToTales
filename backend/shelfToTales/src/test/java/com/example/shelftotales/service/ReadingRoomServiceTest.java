package com.example.shelftotales.service;
import com.example.shelftotales.review.domain.*;
import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.auth.application.*;
import com.example.shelftotales.auth.infrastructure.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.catalog.application.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.bookshelf.application.*;
import com.example.shelftotales.bookshelf.infrastructure.*;
import com.example.shelftotales.bookshelf.presentation.*;
import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.application.*;
import com.example.shelftotales.commerce.infrastructure.*;
import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.social.application.*;
import com.example.shelftotales.social.infrastructure.*;
import com.example.shelftotales.gamification.domain.*;
import com.example.shelftotales.gamification.application.*;
import com.example.shelftotales.gamification.infrastructure.*;
import com.example.shelftotales.exchange.domain.*;
import com.example.shelftotales.exchange.application.*;
import com.example.shelftotales.exchange.infrastructure.*;
import com.example.shelftotales.ai.application.*;
import com.example.shelftotales.readingroom.domain.*;
import com.example.shelftotales.readingroom.application.*;
import com.example.shelftotales.readingroom.infrastructure.*;
import com.example.shelftotales.review.application.*;
import com.example.shelftotales.review.infrastructure.*;
import com.example.shelftotales.wishlist.application.*;
import com.example.shelftotales.wishlist.infrastructure.*;
import com.example.shelftotales.shared.security.*;
import com.example.shelftotales.shared.util.*;
import com.example.shelftotales.auth.presentation.*;
import com.example.shelftotales.shared.dto.*;

import com.example.shelftotales.social.application.SocialService;


import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.shared.util.AuthUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReadingRoomServiceTest {

    @Mock
    private ReadingRoomRepository readingRoomRepository;

    @Mock
    private RoomMessageRepository roomMessageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SocialService socialService;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private RoomMemberService roomMemberService;

    @Mock
    private RoomMemberRepository roomMemberRepository;

    @InjectMocks
    private ReadingRoomService readingRoomService;

    private User currentUser;
    private ReadingRoom readingRoom;
    private RoomMessage roomMessage;

    @BeforeEach
    void setUp() {
        currentUser = User.builder()
                .id(1L)
                .email("current@example.com")
                .fullName("Current User")
                .role(Role.USER)
                .following(new HashSet<>())
                .followers(new HashSet<>())
                .build();

        readingRoom = ReadingRoom.builder()
                .id(10L)
                .name("Fiction Club")
                .description("Talk about fiction books")
                .createdBy(currentUser)
                .createdAt(LocalDateTime.now())
                .messages(new ArrayList<>())
                .build();

        roomMessage = RoomMessage.builder()
                .id(100L)
                .room(readingRoom)
                .sender(currentUser)
                .content("Hello World")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createRoom_success() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(currentUser);
            when(readingRoomRepository.save(any(ReadingRoom.class))).thenReturn(readingRoom);
            when(roomMemberRepository.countByRoomId(10L)).thenReturn(1L);
            when(roomMemberService.isMember(10L, 1L)).thenReturn(true);

            ReadingRoomRequest request = ReadingRoomRequest.builder()
                    .name("Fiction Club")
                    .description("Talk about fiction books")
                    .build();

            ReadingRoomResponse response = readingRoomService.createRoom(request);

            assertNotNull(response);
            assertEquals(10L, response.getId());
            assertEquals("Fiction Club", response.getName());
            verify(readingRoomRepository).save(any(ReadingRoom.class));
            verify(socialService).logCustomActivity(eq(currentUser), eq("CREATE_ROOM"), eq(10L), anyString());
            verify(roomMemberService).addMember(10L, 1L, "OWNER");
        }
    }

    @Test
    void getRooms_returnsRooms() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(currentUser);
            when(readingRoomRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(readingRoom));
            when(roomMemberService.isMember(10L, 1L)).thenReturn(true);
            when(roomMemberRepository.countByRoomId(10L)).thenReturn(1L);

            List<ReadingRoomResponse> rooms = readingRoomService.getRooms();

            assertNotNull(rooms);
            assertEquals(1, rooms.size());
            assertEquals("Fiction Club", rooms.get(0).getName());
        }
    }

    @Test
    void getMessages_returnsMessages() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(currentUser);
            when(readingRoomRepository.findById(10L)).thenReturn(Optional.of(readingRoom));
            when(roomMessageRepository.findByRoomIdOrderByCreatedAtAsc(10L)).thenReturn(List.of(roomMessage));

            List<RoomMessageResponse> messages = readingRoomService.getMessages(10L);

            assertNotNull(messages);
            assertEquals(1, messages.size());
            assertEquals("Hello World", messages.get(0).getContent());
        }
    }

    @Test
    void postMessage_success() {
        when(readingRoomRepository.findById(10L)).thenReturn(Optional.of(readingRoom));
        when(roomMessageRepository.save(any(RoomMessage.class))).thenReturn(roomMessage);

        RoomMessageResponse response = readingRoomService.postMessage(10L, "Hello World", currentUser);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("Hello World", response.getContent());
        verify(roomMessageRepository).save(any(RoomMessage.class));
    }

    @Test
    void createRoom_withBookTitle_resolvesBook() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(currentUser);

            Book book = Book.builder()
                    .id(5L)
                    .title("The Great Gatsby")
                    .pdfUrl("/books/gatsby.pdf")
                    .previewAvailable(true)
                    .build();

            when(bookRepository.findByTitleContainingIgnoreCase("The Great Gatsby"))
                    .thenReturn(List.of(book));

            ReadingRoom savedRoom = ReadingRoom.builder()
                    .id(10L)
                    .name("Fiction Club")
                    .description("Talk about fiction books")
                    .createdBy(currentUser)
                    .createdAt(LocalDateTime.now())
                    .bookTitle("The Great Gatsby")
                    .book(book)
                    .messages(new ArrayList<>())
                    .build();

            when(readingRoomRepository.save(any(ReadingRoom.class))).thenAnswer(invocation -> {
                ReadingRoom roomToSave = invocation.getArgument(0);
                assertEquals("The Great Gatsby", roomToSave.getBookTitle());
                assertEquals(book, roomToSave.getBook());
                return savedRoom;
            });
            when(roomMemberRepository.countByRoomId(10L)).thenReturn(1L);
            when(roomMemberService.isMember(10L, 1L)).thenReturn(true);

            ReadingRoomRequest request = ReadingRoomRequest.builder()
                    .name("Fiction Club")
                    .description("Talk about fiction books")
                    .bookTitle("The Great Gatsby")
                    .build();

            ReadingRoomResponse response = readingRoomService.createRoom(request);

            assertNotNull(response);
            assertEquals(10L, response.getId());
            assertEquals("Fiction Club", response.getName());
            assertEquals(5L, response.getBookId());
            assertEquals("The Great Gatsby", response.getBookTitle());
            assertEquals("/books/gatsby.pdf", response.getPdfUrl());
            assertTrue(response.isPreviewAvailable());

            verify(bookRepository).findByTitleContainingIgnoreCase("The Great Gatsby");
            verify(readingRoomRepository).save(any(ReadingRoom.class));
            verify(socialService).logCustomActivity(eq(currentUser), eq("CREATE_ROOM"), eq(10L), anyString());
            verify(roomMemberService).addMember(10L, 1L, "OWNER");
        }
    }
}
