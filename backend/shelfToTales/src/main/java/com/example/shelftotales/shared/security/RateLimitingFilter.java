package com.example.shelftotales.shared.security;

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

    public RateLimitingFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/auth/");
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

    private void evictStaleEntries() {
        if (buckets.size() <= MAX_BUCKETS / 2) return; // Only evict when approaching limit
        Instant cutoff = Instant.now().minus(EVICTION_TTL);
        buckets.entrySet().removeIf(e -> e.getValue().lastAccess().isBefore(cutoff));
    }

    private static String clientKey(HttpServletRequest request) {
        // Only trust X-Forwarded-For from known proxies; fall back to remoteAddr
        return request.getRemoteAddr();
    }

    private static Bucket newBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(CAPACITY)
                .refillIntervally(CAPACITY, WINDOW)
                .build();
        return Bucket.builder().addLimit(limit).build();
    }
}
