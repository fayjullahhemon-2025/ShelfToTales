package com.example.shelftotales.ai.application;

import com.example.shelftotales.ai.infrastructure.SearchClick;
import com.example.shelftotales.ai.infrastructure.SearchClickRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchAnalyticsService {

    private final SearchClickRepository repository;

    /**
     * Persist a search click asynchronously. Never throws — analytics must not break UX.
     */
    @Async
    public void recordClick(Long userId, Long bookId, String query, int position, String source) {
        try {
            repository.save(SearchClick.builder()
                    .userId(userId)
                    .bookId(bookId)
                    .query(query)
                    .position(position)
                    .source(source)
                    .build());
        } catch (RuntimeException e) {
            log.warn("Failed to persist search click: {}", e.getMessage());
        }
    }
}
