package com.example.shelftotales.readingroom.application;

import com.example.shelftotales.readingroom.domain.*;
import com.example.shelftotales.readingroom.infrastructure.*;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoomMemberServiceTest {
    @Mock private RoomMemberRepository roomMemberRepository;
    @Mock private ReadingRoomRepository readingRoomRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private RoomMemberService roomMemberService;

    @Test
    void addMember_createsMemberWhenNotExists() {
        when(roomMemberRepository.existsByRoomIdAndUserId(1L, 2L)).thenReturn(false);
        when(readingRoomRepository.findById(1L)).thenReturn(Optional.of(mock(ReadingRoom.class)));
        when(userRepository.findById(2L)).thenReturn(Optional.of(mock(User.class)));
        roomMemberService.addMember(1L, 2L, "MEMBER");
        verify(roomMemberRepository).save(any(RoomMember.class));
    }

    @Test
    void addMember_skipsWhenAlreadyMember() {
        when(roomMemberRepository.existsByRoomIdAndUserId(1L, 2L)).thenReturn(true);
        roomMemberService.addMember(1L, 2L, "MEMBER");
        verify(roomMemberRepository, never()).save(any());
    }

    @Test
    void isMember_returnsTrueWhenMember() {
        when(roomMemberRepository.existsByRoomIdAndUserId(1L, 2L)).thenReturn(true);
        assertTrue(roomMemberService.isMember(1L, 2L));
    }

    @Test
    void isMember_returnsFalseWhenNotMember() {
        when(roomMemberRepository.existsByRoomIdAndUserId(1L, 2L)).thenReturn(false);
        assertFalse(roomMemberService.isMember(1L, 2L));
    }
}
