package com.example.shelftotales.shared.security;

import java.util.List;

/** Categorical grouping of request paths for per-IP rate limiting. */
public enum RouteCategory {
    AUTH(List.of("/api/auth/")),
    CHECKOUT(List.of("/api/checkout")),
    ORDERS(List.of("/api/orders")),
    EXCHANGE(List.of("/api/exchange/")),
    SOCIAL(List.of("/api/social/")),
    ADMIN(List.of("/api/admin/")),
    AI(List.of("/api/ai/chat")),
    REVIEWS(List.of("/api/reviews/")),
    ROOMS(List.of("/api/rooms/")),
    SEARCH(List.of("/api/search")),
    OTHER(List.of());

    private final List<String> prefixes;

    RouteCategory(List<String> prefixes) {
        this.prefixes = prefixes;
    }

    public List<String> getPrefixes() {
        return prefixes;
    }

    public static RouteCategory fromUri(String uri) {
        if (uri == null) return OTHER;
        for (RouteCategory c : values()) {
            for (String p : c.prefixes) {
                if (uri.startsWith(p)) return c;
            }
        }
        return OTHER;
    }
}
