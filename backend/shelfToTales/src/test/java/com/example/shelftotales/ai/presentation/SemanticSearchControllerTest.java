package com.example.shelftotales.ai.presentation;

import com.example.shelftotales.ai.application.EmbeddingService;
import com.example.shelftotales.ai.application.UnifiedSearchService;
import com.example.shelftotales.ai.rag.EmbeddingIndexer;
import com.example.shelftotales.catalog.application.BookService;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.catalog.infrastructure.ImageHashService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SemanticSearchController.class)
@AutoConfigureMockMvc(addFilters = false)
class SemanticSearchControllerTest {

    @Autowired private MockMvc mvc;
    @MockBean private EmbeddingService embeddingService;
    @MockBean private ImageHashService imageHashService;
    @MockBean private BookRepository bookRepository;
    @MockBean private JdbcTemplate jdbcTemplate;
    @MockBean private EmbeddingIndexer embeddingIndexer;
    @MockBean private BookService bookService;
    @MockBean private UnifiedSearchService unifiedSearchService;
    @MockBean private com.example.shelftotales.admin.application.SecurityMonitoringService securityMonitoringService;

    @Test
    void unified_happyPath_returns200AndMergedResults() throws Exception {
        when(bookService.getBooks(anyString(), any(), any(), any(), any(Boolean.class), any(), anyInt(), anyInt(), anyString(), anyString()))
                .thenReturn(com.example.shelftotales.shared.dto.PagedResponse.<com.example.shelftotales.catalog.application.BookResponse>builder()
                        .content(java.util.List.of())
                        .build());
        when(embeddingService.searchSimilar(anyString(), anyInt(), any()))
                .thenReturn(java.util.List.of());
        when(unifiedSearchService.merge(anyString(), any(), any(), anyInt(), anyInt(), any(), any(), any()))
                .thenReturn(com.example.shelftotales.ai.application.UnifiedSearchResponse.builder()
                        .query("cosmos")
                        .results(java.util.List.of())
                        .total(0)
                        .signals(com.example.shelftotales.ai.application.UnifiedSearchResponse.Signals.builder()
                                .text("ok").semantic("ok").build())
                        .build());

        mvc.perform(get("/api/search").param("q", "cosmos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.signals.text").value("ok"))
                .andExpect(jsonPath("$.signals.semantic").value("ok"));
    }

    @Test
    void unified_semanticThrows_returns200WithSemanticDegraded() throws Exception {
        when(bookService.getBooks(anyString(), any(), any(), any(), any(Boolean.class), any(), anyInt(), anyInt(), anyString(), anyString()))
                .thenReturn(com.example.shelftotales.shared.dto.PagedResponse.<com.example.shelftotales.catalog.application.BookResponse>builder()
                        .content(java.util.List.of())
                        .build());
        when(embeddingService.searchSimilar(anyString(), anyInt(), any()))
                .thenThrow(new RuntimeException("onnx down"));
        when(unifiedSearchService.merge(anyString(), any(), any(), anyInt(), anyInt(), any(), any(), any()))
                .thenReturn(com.example.shelftotales.ai.application.UnifiedSearchResponse.builder()
                        .query("cosmos")
                        .signals(com.example.shelftotales.ai.application.UnifiedSearchResponse.Signals.builder()
                                .text("ok").semantic("ok").build())
                        .build());

        mvc.perform(get("/api/search").param("q", "cosmos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.signals.semantic").value("degraded"));
    }

    @Test
    void unified_textThrows_returns200WithTextDegraded() throws Exception {
        when(bookService.getBooks(anyString(), any(), any(), any(), any(Boolean.class), any(), anyInt(), anyInt(), anyString(), anyString()))
                .thenThrow(new RuntimeException("db down"));
        when(embeddingService.searchSimilar(anyString(), anyInt(), any()))
                .thenReturn(java.util.List.of());
        when(unifiedSearchService.merge(anyString(), any(), any(), anyInt(), anyInt(), any(), any(), any()))
                .thenReturn(com.example.shelftotales.ai.application.UnifiedSearchResponse.builder()
                        .query("cosmos")
                        .signals(com.example.shelftotales.ai.application.UnifiedSearchResponse.Signals.builder()
                                .text("ok").semantic("ok").build())
                        .build());

        mvc.perform(get("/api/search").param("q", "cosmos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.signals.text").value("degraded"));
    }

    @Test
    void unified_bothThrow_returns503() throws Exception {
        when(bookService.getBooks(anyString(), any(), any(), any(), any(Boolean.class), any(), anyInt(), anyInt(), anyString(), anyString()))
                .thenThrow(new RuntimeException("db down"));
        when(embeddingService.searchSimilar(anyString(), anyInt(), any()))
                .thenThrow(new RuntimeException("onnx down"));

        mvc.perform(get("/api/search").param("q", "cosmos"))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void unified_blankQuery_returns400() throws Exception {
        mvc.perform(get("/api/search").param("q", "  "))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unified_invalidSize_returns400() throws Exception {
        mvc.perform(get("/api/search").param("q", "x").param("size", "999"))
                .andExpect(status().isBadRequest());
    }
}
