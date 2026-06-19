package com.example.shelftotales.shared.security;

import io.github.bucket4j.Bandwidth;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.EnumMap;
import java.util.Map;

@Configuration
public class RateLimitConfig {

    private static final int CAPACITY = 10;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    @Bean
    public Map<RouteCategory, Bandwidth> rateLimitBandwidths() {
        EnumMap<RouteCategory, Bandwidth> map = new EnumMap<>(RouteCategory.class);
        Bandwidth limit = Bandwidth.builder()
                .capacity(CAPACITY)
                .refillIntervally(CAPACITY, WINDOW)
                .build();
        for (RouteCategory c : RouteCategory.values()) {
            map.put(c, limit);
        }
        return map;
    }
}
