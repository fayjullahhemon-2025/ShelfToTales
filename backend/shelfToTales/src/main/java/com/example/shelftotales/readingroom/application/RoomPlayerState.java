package com.example.shelftotales.readingroom.application;

public record RoomPlayerState(
        Long currentTrackId,
        long positionMs,
        boolean playing,
        long ts,
        String senderEmail
) {
    public static RoomPlayerState empty() {
        return new RoomPlayerState(null, 0L, false, 0L, null);
    }
}
