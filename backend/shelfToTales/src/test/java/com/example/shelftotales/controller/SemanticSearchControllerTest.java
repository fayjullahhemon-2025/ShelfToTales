package com.example.shelftotales.controller;

import com.example.shelftotales.ai.application.*;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.catalog.infrastructure.ImageHashService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class SemanticSearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EmbeddingService embeddingService;

    @MockitoBean
    private ImageHashService imageHashService;

    @MockitoBean
    private BookRepository bookRepository;

    @MockitoBean
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private com.example.shelftotales.catalog.application.BookService bookService;

    @MockitoBean
    private com.example.shelftotales.ai.application.UnifiedSearchService unifiedSearchService;

    @Test
    void search_shouldReturn200() throws Exception {
        when(bookService.getBooks(anyString(), any(), any(), any(), any(Boolean.class), any(), anyInt(), anyInt(), anyString(), anyString()))
                .thenReturn(com.example.shelftotales.shared.dto.PagedResponse.<com.example.shelftotales.catalog.application.BookResponse>builder().content(java.util.List.of()).build());
        when(unifiedSearchService.merge(anyString(), any(), any(), anyInt(), anyInt(), any(), any(), any()))
                .thenReturn(com.example.shelftotales.ai.application.UnifiedSearchResponse.builder()
                        .query("test")
                        .results(java.util.List.of())
                        .total(0)
                        .signals(com.example.shelftotales.ai.application.UnifiedSearchResponse.Signals.builder()
                                .text("ok").semantic("ok").build())
                        .build());

        mockMvc.perform(get("/api/search?q=test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.query").value("test"))
                .andExpect(jsonPath("$.signals.text").value("ok"))
                .andExpect(jsonPath("$.signals.semantic").value("ok"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void searchByImage_shouldUseFallbackOnNonPostgres() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "cover.jpg", MediaType.IMAGE_JPEG_VALUE, "dummy image bytes".getBytes());

        when(imageHashService.computeDHash(any(MultipartFile.class))).thenReturn(12345L);
        when(jdbcTemplate.execute(any(ConnectionCallback.class))).thenReturn("H2");

        Book book = Book.builder().id(1L).title("Fallback Match").coverHash(12345L).build();
        when(bookRepository.findAll()).thenReturn(List.of(book));
        when(imageHashService.hammingDistance(anyLong(), anyLong())).thenReturn(0);

        mockMvc.perform(multipart("/api/search/image").file(file).param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].title").value("Fallback Match"))
                .andExpect(jsonPath("$.results[0].distance").value(0))
                .andExpect(jsonPath("$.queryHash").value(12345));

        verify(bookRepository, times(1)).findAll();
        verify(bookRepository, never()).findSimilarBooksByCoverHashPg(anyLong(), anyInt());
    }

    @Test
    @SuppressWarnings("unchecked")
    void searchByImage_shouldUsePgQueryOnPostgres() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "cover.jpg", MediaType.IMAGE_JPEG_VALUE, "dummy image bytes".getBytes());

        when(imageHashService.computeDHash(any(MultipartFile.class))).thenReturn(12345L);
        when(jdbcTemplate.execute(any(ConnectionCallback.class))).thenReturn("PostgreSQL");

        Book book = Book.builder().id(2L).title("Pg Match").coverHash(12340L).build();
        when(bookRepository.findSimilarBooksByCoverHashPg(anyLong(), anyInt())).thenReturn(List.of(book));
        when(imageHashService.hammingDistance(anyLong(), anyLong())).thenReturn(2);

        mockMvc.perform(multipart("/api/search/image").file(file).param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].title").value("Pg Match"))
                .andExpect(jsonPath("$.results[0].distance").value(2))
                .andExpect(jsonPath("$.queryHash").value(12345));

        verify(bookRepository, never()).findAll();
        verify(bookRepository, times(1)).findSimilarBooksByCoverHashPg(12345L, 5);
    }
}
