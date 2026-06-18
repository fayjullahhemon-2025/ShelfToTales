package com.example.shelftotales.ai.application;

import com.example.shelftotales.ai.infrastructure.SearchClick;
import com.example.shelftotales.ai.infrastructure.SearchClickRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SearchAnalyticsServiceTest {

    @Test
    void recordClick_persistsPayload() {
        SearchClickRepository repo = mock(SearchClickRepository.class);
        SearchAnalyticsService service = new SearchAnalyticsService(repo);

        service.recordClick(7L, 17L, "cosmos", 2, "text");

        ArgumentCaptor<SearchClick> captor = ArgumentCaptor.forClass(SearchClick.class);
        verify(repo).save(captor.capture());
        SearchClick click = captor.getValue();
        assert click.getUserId().equals(7L);
        assert click.getBookId().equals(17L);
        assert click.getQuery().equals("cosmos");
        assert click.getPosition().equals(2);
        assert click.getSource().equals("text");
    }

    @Test
    void recordClick_swallowsRepositoryExceptions() {
        SearchClickRepository repo = mock(SearchClickRepository.class);
        doThrow(new RuntimeException("db down")).when(repo).save(any());
        SearchAnalyticsService service = new SearchAnalyticsService(repo);

        // Must not throw — analytics is fire-and-forget
        service.recordClick(1L, 2L, "q", 0, null);
    }

    @Test
    void recordClick_allowsNullSource() {
        SearchClickRepository repo = mock(SearchClickRepository.class);
        SearchAnalyticsService service = new SearchAnalyticsService(repo);

        service.recordClick(1L, 2L, "q", 0, null);

        ArgumentCaptor<SearchClick> captor = ArgumentCaptor.forClass(SearchClick.class);
        verify(repo).save(captor.capture());
        assert captor.getValue().getSource() == null;
    }
}
