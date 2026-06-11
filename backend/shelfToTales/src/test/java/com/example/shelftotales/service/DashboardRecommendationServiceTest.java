package com.example.shelftotales.service;

import com.example.shelftotales.ai.application.AIService;
import com.example.shelftotales.ai.application.EmbeddingService;
import com.example.shelftotales.ai.domain.UserProfileVector;
import com.example.shelftotales.ai.infrastructure.UserProfileVectorRepository;
import com.example.shelftotales.bookshelf.application.DashboardRecommendationService;
import com.example.shelftotales.bookshelf.application.RecommendedBookDTO;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.domain.BookEmbedding;
import com.example.shelftotales.catalog.infrastructure.BookEmbeddingRepository;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardRecommendationServiceTest {

    @Mock private UserProfileVectorRepository profileVectorRepository;
    @Mock private EmbeddingService embeddingService;
    @Mock private BookEmbeddingRepository bookEmbeddingRepository;
    @Mock private AIService aiService;
    @Mock private BookRepository bookRepository;

    private DashboardRecommendationService recommendationService;

    @BeforeEach
    void setUp() {
        recommendationService = new DashboardRecommendationService(
            profileVectorRepository, embeddingService, bookEmbeddingRepository, aiService, bookRepository
        );
    }

    @Test
    void getDashboardRecommendations_shouldReturnFallbackRecommendations_whenNoProfileVector() {
        when(profileVectorRepository.findById(1L)).thenReturn(Optional.empty());

        org.springframework.data.domain.Page<Book> mockPage = new org.springframework.data.domain.PageImpl<>(List.of(
            Book.builder().id(101L).title("Fallback Book 1").author("Author 1").build(),
            Book.builder().id(102L).title("Fallback Book 2").author("Author 2").build()
        ));
        when(bookRepository.findAll(any(PageRequest.class))).thenReturn(mockPage);

        List<RecommendedBookDTO> recommendations = recommendationService.getDashboardRecommendations(1L);

        assertNotNull(recommendations);
        assertEquals(2, recommendations.size());
        assertEquals("Fallback Book 1", recommendations.get(0).getTitle());
        assertEquals("Trending in our Bookstore", recommendations.get(0).getReason());
    }

    @Test
    void getDashboardRecommendations_shouldReturnCustomRecommendations_whenProfileVectorExists() {
        UserProfileVector userVector = UserProfileVector.builder()
            .userId(1L)
            .vectorData("0.1,0.2")
            .build();
        when(profileVectorRepository.findById(1L)).thenReturn(Optional.of(userVector));

        double[] vector = new double[384];
        when(aiService.stringToVector(anyString())).thenReturn(vector);
        when(embeddingService.getSimilarBookIds(any(double[].class), eq(3))).thenReturn(List.of(201L));

        Book book = Book.builder().id(201L).title("Custom Book").author("Author C").build();
        BookEmbedding embedding = BookEmbedding.builder().bookId(201L).book(book).vectorData("0.3,0.4").build();
        when(bookEmbeddingRepository.findAllById(anyList())).thenReturn(List.of(embedding));
        when(aiService.calculateSimilarity(any(double[].class), any(double[].class))).thenReturn(0.85);

        List<RecommendedBookDTO> recommendations = recommendationService.getDashboardRecommendations(1L);

        assertNotNull(recommendations);
        assertEquals(1, recommendations.size());
        assertEquals("Custom Book", recommendations.get(0).getTitle());
        assertEquals("Great match based on your profile", recommendations.get(0).getReason());
        assertEquals("Great Match", recommendations.get(0).getMatchCategory());
    }
}
