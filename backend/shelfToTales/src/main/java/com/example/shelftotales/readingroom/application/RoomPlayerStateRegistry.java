package com.example.shelftotales.readingroom.application;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class RoomPlayerStateRegistry {

    private final ConcurrentMap<Long, RoomPlayerState> states = new ConcurrentHashMap<>();

    public RoomPlayerState get(Long roomId) {
        return states.get(roomId);
    }

    public void update(Long roomId, RoomPlayerState state) {
        states.put(roomId, state);
    }

    public boolean clearIfCurrent(Long roomId, Long trackId) {
        RoomPlayerState cur = states.get(roomId);
        if (cur == null) return false;
        if (cur.currentTrackId() == null || !cur.currentTrackId().equals(trackId)) return false;
        states.remove(roomId);
        return true;
    }
}
