package com.example.shelftotales.shared.util;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class TokenBlacklist {

    private static final String BLACKLIST_PREFIX = "token:blacklist:";
    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * Blacklist a token with TTL matching JWT expiry (24h).
     */
    public void add(String token) {
        redisTemplate.opsForValue().set(BLACKLIST_PREFIX + token, "1", 24, TimeUnit.HOURS);
    }

    public boolean isBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token));
    }
}
