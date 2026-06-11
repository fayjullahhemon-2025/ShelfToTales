package com.example.shelftotales.shared.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklist {

    private static final String BLACKLIST_PREFIX = "token:blacklist:";
    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * Blacklist a token with TTL matching JWT expiry (24h).
     */
    public void add(String token) {
        try {
            redisTemplate.opsForValue().set(BLACKLIST_PREFIX + token, "1", 24, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Failed to blacklist token in Redis: {}", e.getMessage());
        }
    }

    public boolean isBlacklisted(String token) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token));
        } catch (Exception e) {
            log.warn("Redis unavailable for token blacklist check, allowing request: {}", e.getMessage());
            return false;
        }
    }
}
