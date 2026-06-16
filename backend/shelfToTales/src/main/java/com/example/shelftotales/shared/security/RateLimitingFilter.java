package com.example.shelftotales.shared.security;

import com.example.shelftotales.admin.application.SecurityMonitoringService;
import com.example.shelftotales.admin.domain.SecurityEventSeverity;
import com.example.shelftotales.admin.domain.SecurityEventType;
import com.example.shelftotales.shared.dto.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-IP rate limiter for /api/auth/** endpoints.
 *
 * Uses Bucket4j with an in-memory token bucket: each client IP is
 * allowed 10 requests per minute. Requests over the limit get a
 * 429 with a structured {@link ErrorResponse} body.
 *
 * Buckets are evicted individually after TTL expiry (2× window) to
 * prevent memory exhaustion without resetting all rate limits at once.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int CAPACITY = 10;
    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final Duration EVICTION_TTL = Duration.ofMinutes(2);
    private static final int MAX_BUCKETS = 10_000;

    private record BucketEntry(Bucket bucket, Instant lastAccess) {}

    private final Map<String, BucketEntry> buckets = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;
    private final SecurityMonitoringService securityMonitoringService;

    public RateLimitingFilter(ObjectMapper objectMapper, SecurityMonitoringService securityMonitoringService) {
        this.objectMapper = objectMapper;
        this.securityMonitoringService = securityMonitoringService;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String uri = request.getRequestURI();
        return !(uri.startsWith("/api/auth/") ||
                 uri.startsWith("/api/checkout") ||
                 uri.startsWith("/api/orders") ||
                 uri.startsWith("/api/exchange/") ||
                 uri.startsWith("/api/social/follow") ||
                 uri.startsWith("/api/social/friends") ||
                 uri.startsWith("/api/social/requests") ||
                 uri.startsWith("/api/social/status") ||
                 uri.startsWith("/api/social/unfriend") ||
                 uri.startsWith("/api/social/block") ||
                 uri.startsWith("/api/social/report") ||
                 uri.startsWith("/api/admin/users") ||
                 uri.startsWith("/api/admin/orders") ||
                 uri.startsWith("/api/admin/coupons") ||
                 uri.startsWith("/api/admin/reports") ||
                 uri.startsWith("/api/ai/chat") ||
                 uri.startsWith("/api/reviews/") ||
                 uri.startsWith("/api/rooms/"));
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        evictStaleEntries();

        String key = clientKey(request);
        BucketEntry entry = buckets.compute(key, (k, existing) -> {
            if (existing == null) {
                return new BucketEntry(newBucket(), Instant.now());
            }
            return new BucketEntry(existing.bucket(), Instant.now());
        });

        if (entry.bucket().tryConsume(1)) {
            filterChain.doFilter(request, response);
            return;
        }

        recordRateLimitEvent(request);

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(WINDOW.toSeconds()));

        ErrorResponse err = new ErrorResponse(
                HttpStatus.TOO_MANY_REQUESTS.value(),
                "Too Many Requests",
                "Rate limit exceeded. Try again in " + WINDOW.toSeconds() + " seconds."
        );
        response.getWriter().write(objectMapper.writeValueAsString(err));
    }

    private void recordRateLimitEvent(HttpServletRequest request) {
        try {
            securityMonitoringService.record(
                    SecurityEventType.RATE_LIMIT_EXCEEDED,
                    SecurityEventSeverity.HIGH,
                    request,
                    null,
                    "Rate limit exceeded for " + clientKey(request)
            );
        } catch (RuntimeException ignored) {
            // Monitoring must never block request handling.
        }
    }

    private void evictStaleEntries() {
        if (buckets.size() <= MAX_BUCKETS / 2) return; // Only evict when approaching limit
        Instant cutoff = Instant.now().minus(EVICTION_TTL);
        buckets.entrySet().removeIf(e -> e.getValue().lastAccess().isBefore(cutoff));
    }

    private static String clientKey(HttpServletRequest request) {
        // Only trust X-Forwarded-For from known proxies; fall back to remoteAddr
        String ip = request.getRemoteAddr();
        String uri = request.getRequestURI();
        String category;
        if (uri.startsWith("/api/auth/")) {
            category = "auth";
        } else if (uri.startsWith("/api/checkout")) {
            category = "checkout";
        } else if (uri.startsWith("/api/orders")) {
            category = "orders";
        } else if (uri.startsWith("/api/exchange/")) {
            category = "exchange";
        } else if (uri.startsWith("/api/social/follow") ||
                   uri.startsWith("/api/social/friends") ||
                   uri.startsWith("/api/social/requests") ||
                   uri.startsWith("/api/social/status") ||
                   uri.startsWith("/api/social/unfriend") ||
                   uri.startsWith("/api/social/block") ||
                   uri.startsWith("/api/social/report")) {
            category = "social";
        } else if (uri.startsWith("/api/admin/users") ||
                   uri.startsWith("/api/admin/orders") ||
                   uri.startsWith("/api/admin/coupons") ||
                   uri.startsWith("/api/admin/reports")) {
            category = "admin";
        } else if (uri.startsWith("/api/ai/chat")) {
            category = "ai";
        } else if (uri.startsWith("/api/reviews/")) {
            category = "reviews";
        } else {
            category = "other";
        }
        return ip + ":" + category;
    }

    private static Bucket newBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(CAPACITY)
                .refillIntervally(CAPACITY, WINDOW)
                .build();
        return Bucket.builder().addLimit(limit).build();
    }
}
