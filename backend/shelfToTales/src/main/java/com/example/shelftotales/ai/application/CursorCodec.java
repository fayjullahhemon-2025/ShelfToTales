package com.example.shelftotales.ai.application;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/** Encode/decode opaque base64 cursors carrying a bookId. */
public final class CursorCodec {

    private CursorCodec() {}

    public static String encode(Long bookId) {
        if (bookId == null) return null;
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(("b:" + bookId).getBytes(StandardCharsets.UTF_8));
    }

    public static Long decode(String cursor) {
        if (cursor == null || cursor.isBlank()) return null;
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            if (decoded.startsWith("b:")) {
                return Long.parseLong(decoded.substring(2));
            }
        } catch (RuntimeException ignored) {
            // fall through
        }
        return null;
    }
}