package com.example.shelftotales.readingroom.application;
import com.example.shelftotales.readingroom.domain.*;
import com.example.shelftotales.readingroom.infrastructure.*;

import com.example.shelftotales.social.application.SocialService;

import com.example.shelftotales.shared.dto.*;
import com.example.shelftotales.auth.application.*;
import com.example.shelftotales.catalog.application.*;
import com.example.shelftotales.bookshelf.application.*;
import com.example.shelftotales.commerce.application.*;
import com.example.shelftotales.social.application.*;
import com.example.shelftotales.readingroom.application.*;
import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.auth.infrastructure.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.bookshelf.infrastructure.*;
import com.example.shelftotales.wishlist.infrastructure.*;
import com.example.shelftotales.review.infrastructure.*;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReadingRoomService {

    private final ReadingRoomRepository readingRoomRepository;
    private final RoomMessageRepository roomMessageRepository;
    private final UserRepository userRepository;
    private final SocialService socialService;
    private final BookRepository bookRepository;

    @Transactional
    public ReadingRoomResponse createRoom(ReadingRoomRequest request) {
        User user = AuthUtils.getCurrentUser(userRepository);
        ReadingRoom room = ReadingRoom.builder()
                .name(request.getName())
                .description(request.getDescription())
                .createdBy(user)
                .build();

        if (request.getBookTitle() != null && !request.getBookTitle().isBlank()) {
            room.setBookTitle(request.getBookTitle().trim());
            bookRepository.findByTitleContainingIgnoreCase(request.getBookTitle().trim())
                    .stream().findFirst()
                    .ifPresent(room::setBook);
        }

        ReadingRoom savedRoom = readingRoomRepository.save(room);

        // Log Social Activity
        String creatorName = user.getFullName();
        if (creatorName == null || creatorName.isBlank()) creatorName = user.getEmail();
        socialService.logCustomActivity(user, "CREATE_ROOM", savedRoom.getId(),
                creatorName + " created community reading room: " + savedRoom.getName());

        return mapToReadingRoomResponse(savedRoom, user);
    }

    @Transactional(readOnly = true)
    public List<ReadingRoomResponse> getRooms() {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        return readingRoomRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(room -> mapToReadingRoomResponse(room, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RoomMessageResponse> getMessages(Long roomId) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        if (!readingRoomRepository.existsById(roomId)) {
            throw new IllegalArgumentException("Reading room not found: " + roomId);
        }

        List<RoomMessage> messages = roomMessageRepository.findByRoomIdOrderByCreatedAtAsc(roomId);
        return messages.stream()
                .map(msg -> mapToRoomMessageResponse(msg, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional
    public RoomMessageResponse postMessage(Long roomId, String content, User sender) {
        ReadingRoom room = readingRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Reading room not found: " + roomId));

        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Message content cannot be empty");
        }

        RoomMessage msg = RoomMessage.builder()
                .room(room)
                .sender(sender)
                .content(content)
                .build();

        RoomMessage savedMsg = roomMessageRepository.save(msg);
        return mapToRoomMessageResponse(savedMsg, sender);
    }

    private ReadingRoomResponse mapToReadingRoomResponse(ReadingRoom room, User currentUser) {
        return ReadingRoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .description(room.getDescription())
                .createdAt(room.getCreatedAt())
                .createdBy(mapToUserSummaryResponse(room.getCreatedBy(), currentUser))
                .bookId(room.getBook() != null ? room.getBook().getId() : null)
                .bookTitle(room.getBookTitle())
                .pdfUrl(room.getBook() != null ? room.getBook().getPdfUrl() : null)
                .previewAvailable(room.getBook() != null && room.getBook().isPreviewAvailable())
                .build();
    }

    private RoomMessageResponse mapToRoomMessageResponse(RoomMessage msg, User currentUser) {
        return RoomMessageResponse.builder()
                .id(msg.getId())
                .roomId(msg.getRoom().getId())
                .content(msg.getContent())
                .createdAt(msg.getCreatedAt())
                .sender(mapToUserSummaryResponse(msg.getSender(), currentUser))
                .build();
    }

    private UserSummaryResponse mapToUserSummaryResponse(User user, User currentUser) {
        String name = user.getFullName();
        if (name == null || name.isBlank()) {
            name = user.getEmail();
        }

        return UserSummaryResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(name)
                .profileImageUrl(user.getProfileImageUrl())
                .isFollowing(currentUser.getFollowing().contains(user))
                .build();
    }
}
