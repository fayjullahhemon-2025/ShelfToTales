package com.example.shelftotales.service;

import com.example.shelftotales.ai.application.AIService;
import com.example.shelftotales.ai.application.EmbeddingService;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.domain.BookEmbedding;
import com.example.shelftotales.catalog.infrastructure.BookEmbeddingRepository;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmbeddingServiceTest {

    @Mock
    private BookEmbeddingRepository embeddingRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private AIService aiService;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private EmbeddingService embeddingService;

    @BeforeEach
    void setUp() {
        // We do not call embeddingService.init() here because each test setup
        // may need different jdbcTemplate behaviors. We will call it in each test.
    }

    @Test
    void testInitPgVectorAvailable() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class))).thenReturn(true);
        embeddingService.init();
        assertTrue(embeddingService.isPgVectorAvailable());
    }

    @Test
    void testInitPgVectorNotAvailable() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class))).thenReturn(false);
        embeddingService.init();
        assertFalse(embeddingService.isPgVectorAvailable());
    }

    @Test
    void testInitPgVectorException() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class))).thenThrow(new RuntimeException("DB error"));
        embeddingService.init();
        assertFalse(embeddingService.isPgVectorAvailable());
    }

    @Test
    void testGetSimilarBookIdsPgVector() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class))).thenReturn(true);
        embeddingService.init();

        double[] vector = {0.1, 0.2};
        when(aiService.vectorToString(vector)).thenReturn("0.1,0.2");
        when(embeddingRepository.findSimilarBookIdsPgVector("[0.1,0.2]", 5))
                .thenReturn(List.of(1L, 2L));

        List<Long> result = embeddingService.getSimilarBookIds(vector, 5);
        assertEquals(List.of(1L, 2L), result);
        verify(embeddingRepository).findSimilarBookIdsPgVector("[0.1,0.2]", 5);
        verify(embeddingRepository, never()).findSimilarBookIdsFallback(anyString(), anyInt());
    }

    @Test
    void testGetSimilarBookIdsFallback() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class))).thenReturn(false);
        embeddingService.init();

        double[] vector = {0.1, 0.2};
        when(aiService.vectorToString(vector)).thenReturn("0.1,0.2");
        when(embeddingRepository.findSimilarBookIdsFallback("0.1,0.2", 5))
                .thenReturn(List.of(3L, 4L));

        List<Long> result = embeddingService.getSimilarBookIds(vector, 5);
        assertEquals(List.of(3L, 4L), result);
        verify(embeddingRepository).findSimilarBookIdsFallback("0.1,0.2", 5);
        verify(embeddingRepository, never()).findSimilarBookIdsPgVector(anyString(), anyInt());
    }

    @Test
    void testGetSimilarBookIdsExcludingPgVector() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class))).thenReturn(true);
        embeddingService.init();

        double[] vector = {0.1, 0.2};
        when(aiService.vectorToString(vector)).thenReturn("0.1,0.2");
        when(embeddingRepository.findSimilarBookIdsExcludingPgVector(10L, "[0.1,0.2]", 5))
                .thenReturn(List.of(1L, 2L));

        List<Long> result = embeddingService.getSimilarBookIdsExcluding(vector, 10L, 5);
        assertEquals(List.of(1L, 2L), result);
        verify(embeddingRepository).findSimilarBookIdsExcludingPgVector(10L, "[0.1,0.2]", 5);
        verify(embeddingRepository, never()).findSimilarBookIdsExcludingFallback(anyLong(), anyString(), anyInt());
    }

    @Test
    void testGetSimilarBookIdsExcludingFallback() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class))).thenReturn(false);
        embeddingService.init();

        double[] vector = {0.1, 0.2};
        when(aiService.vectorToString(vector)).thenReturn("0.1,0.2");
        when(embeddingRepository.findSimilarBookIdsExcludingFallback(10L, "0.1,0.2", 5))
                .thenReturn(List.of(3L, 4L));

        List<Long> result = embeddingService.getSimilarBookIdsExcluding(vector, 10L, 5);
        assertEquals(List.of(3L, 4L), result);
        verify(embeddingRepository).findSimilarBookIdsExcludingFallback(10L, "0.1,0.2", 5);
        verify(embeddingRepository, never()).findSimilarBookIdsExcludingPgVector(anyLong(), anyString(), anyInt());
    }

    @Test
    void testSearchSimilar() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class))).thenReturn(true);
        embeddingService.init();

        String query = "test query";
        double[] queryVec = {0.5, 0.5};
        when(aiService.generateEmbedding(query)).thenReturn(queryVec);
        when(aiService.vectorToString(queryVec)).thenReturn("0.5,0.5");

        when(embeddingRepository.findSimilarBookIdsPgVector("[0.5,0.5]", 2))
                .thenReturn(List.of(1L, 2L));

        Book book1 = Book.builder().id(1L).title("Book One").build();
        Book book2 = Book.builder().id(2L).title("Book Two").build();

        BookEmbedding emb1 = BookEmbedding.builder().bookId(1L).book(book1).vectorData("0.4,0.6").build();
        BookEmbedding emb2 = BookEmbedding.builder().bookId(2L).book(book2).vectorData("0.5,0.5").build();

        when(embeddingRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(emb1, emb2));
        when(aiService.stringToVector("0.4,0.6")).thenReturn(new double[]{0.4, 0.6});
        when(aiService.stringToVector("0.5,0.5")).thenReturn(new double[]{0.5, 0.5});
        when(aiService.calculateSimilarity(queryVec, new double[]{0.4, 0.6})).thenReturn(0.8);
        when(aiService.calculateSimilarity(queryVec, new double[]{0.5, 0.5})).thenReturn(1.0);

        List<Map.Entry<Book, Double>> results = embeddingService.searchSimilar(query, 2, null);

        assertEquals(2, results.size());
        assertEquals("Book Two", results.get(0).getKey().getTitle());
        assertEquals(1.0, results.get(0).getValue());
        assertEquals("Book One", results.get(1).getKey().getTitle());
        assertEquals(0.8, results.get(1).getValue());
    }

    @Test
    void testEmbedBookPgVector() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class))).thenReturn(true);
        embeddingService.init();

        Book book = Book.builder().id(1L).title("Book Title").author("Author").build();
        double[] vector = {0.1, 0.2, 0.3};
        when(aiService.generateEmbedding(anyString())).thenReturn(vector);
        when(aiService.vectorToString(vector)).thenReturn("0.1,0.2,0.3");
        when(embeddingRepository.findById(1L)).thenReturn(Optional.empty());

        embeddingService.embedBook(book);

        verify(embeddingRepository).saveAndFlush(any(BookEmbedding.class));

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object[]> argsCaptor = ArgumentCaptor.forClass(Object[].class);
        verify(jdbcTemplate).update(sqlCaptor.capture(), argsCaptor.capture());

        assertEquals("UPDATE book_embeddings SET embedding = CAST(? AS vector) WHERE book_id = ?", sqlCaptor.getValue());
        Object[] args = argsCaptor.getValue();
        assertEquals(2, args.length);
        assertEquals("[0.1,0.2,0.3]", args[0]);
        assertEquals(1L, args[1]);
    }

    @Test
    void testEmbedBookNoPgVector() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class))).thenReturn(false);
        embeddingService.init();

        Book book = Book.builder().id(1L).title("Book Title").author("Author").build();
        double[] vector = {0.1, 0.2, 0.3};
        when(aiService.generateEmbedding(anyString())).thenReturn(vector);
        when(aiService.vectorToString(vector)).thenReturn("0.1,0.2,0.3");
        when(embeddingRepository.findById(1L)).thenReturn(Optional.empty());

        embeddingService.embedBook(book);

        verify(embeddingRepository).saveAndFlush(any(BookEmbedding.class));
        verify(jdbcTemplate, never()).update(anyString(), any(Object[].class));
    }
}
