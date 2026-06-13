package com.example.shelftotales.ai.application;

import com.example.shelftotales.ai.domain.SpoilerAssessment;
import com.example.shelftotales.ai.domain.SpoilerLevel;
import com.example.shelftotales.ai.infrastructure.SpoilerAssessmentRepository;
import com.example.shelftotales.review.infrastructure.ReviewRepository;
import com.example.shelftotales.review.domain.Review;
import com.example.shelftotales.catalog.domain.Book;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SpoilerDetectionServiceTest {

    @Mock private HeuristicSpoilerClassifier heuristicClassifier;
    @Mock private SpoilerAssessmentRepository assessmentRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private LlmSpoilerClassifier llmClassifier;
    @Mock private BookSpoilerClassifier bookClassifier;
    @Mock private TransformerSpoilerClassifier transformerClassifier;
    @Mock private HuggingFaceSpoilerClassifier huggingFaceClassifier;
    @Mock private SpoilerModelRegistry modelRegistry;
    @Mock private TrainingTriggerService trainingTriggerService;

    private SpoilerDetectionService service;

    @BeforeEach
    void setUp() {
        service = new SpoilerDetectionService(
                heuristicClassifier, assessmentRepository, reviewRepository,
                Optional.of(llmClassifier), Optional.of(bookClassifier),
                Optional.of(transformerClassifier), Optional.of(huggingFaceClassifier),
                modelRegistry, trainingTriggerService
        );
        ReflectionTestUtils.setField(service, "provider", "heuristic");
    }

    @Test
    void usesHeuristic_whenProviderIsHeuristic() {
        SpoilerAssessment expected = SpoilerAssessment.builder()
                .reviewId(1L).userId(10L)
                .spoilerLevel(SpoilerLevel.SAFE)
                .spoilerScore(BigDecimal.ZERO)
                .spoilerSentences(List.of())
                .sanitizedReview("")
                .model("heuristic-v1")
                .build();
        when(heuristicClassifier.classify(1L, 10L, "Great book")).thenReturn(expected);
        when(assessmentRepository.save(any())).thenReturn(expected);
        when(reviewRepository.findById(1L)).thenReturn(Optional.empty());

        SpoilerAssessment result = service.assessAndPersist(1L, 10L, "Great book");

        assertEquals("heuristic-v1", result.getModel());
        verify(heuristicClassifier).classify(1L, 10L, "Great book");
        verifyNoInteractions(llmClassifier);
    }

    @Test
    void usesBookClassifier_whenProviderIsBookLlmAndModelExists() {
        ReflectionTestUtils.setField(service, "provider", "book-llm");
        when(modelRegistry.hasActiveModel(5L)).thenReturn(true);

        SpoilerAssessment expected = SpoilerAssessment.builder()
                .reviewId(2L).userId(10L)
                .spoilerLevel(SpoilerLevel.MINOR_SPOILER)
                .spoilerScore(BigDecimal.valueOf(0.6))
                .spoilerSentences(List.of())
                .sanitizedReview("")
                .model("shelf-spoiler-book-5")
                .build();
        when(bookClassifier.classify(2L, 10L, "text")).thenReturn(expected);
        when(assessmentRepository.save(any())).thenReturn(expected);

        SpoilerAssessment result = service.assessAndPersist(2L, 10L, 5L, "text");

        assertEquals("shelf-spoiler-book-5", result.getModel());
        verify(bookClassifier).classify(2L, 10L, "text");
    }

    @Test
    void fallsBackToHeuristic_whenLlmReturnsZeroScore() {
        ReflectionTestUtils.setField(service, "provider", "llm");

        SpoilerAssessment llmFail = SpoilerAssessment.builder()
                .reviewId(3L).userId(10L)
                .spoilerLevel(SpoilerLevel.SAFE)
                .spoilerScore(BigDecimal.ZERO)
                .spoilerSentences(List.of())
                .sanitizedReview("")
                .model("openrouter-llama")
                .build();
        when(llmClassifier.classify(3L, 10L, "text")).thenReturn(llmFail);

        SpoilerAssessment heuristicResult = SpoilerAssessment.builder()
                .reviewId(3L).userId(10L)
                .spoilerLevel(SpoilerLevel.MAJOR_SPOILER)
                .spoilerScore(BigDecimal.valueOf(0.9))
                .spoilerSentences(List.of())
                .sanitizedReview("[REDACTED]")
                .model("heuristic-v1")
                .build();
        when(heuristicClassifier.classify(3L, 10L, "text")).thenReturn(heuristicResult);
        when(assessmentRepository.save(any())).thenReturn(heuristicResult);
        when(reviewRepository.findById(3L)).thenReturn(Optional.empty());

        SpoilerAssessment result = service.assessAndPersist(3L, 10L, "text");

        assertEquals(SpoilerLevel.MAJOR_SPOILER, result.getSpoilerLevel());
        verify(heuristicClassifier).classify(3L, 10L, "text");
    }

    @Test
    void mirrorsSpoilerLevelToReview() {
        SpoilerAssessment assessment = SpoilerAssessment.builder()
                .reviewId(4L).userId(10L)
                .spoilerLevel(SpoilerLevel.MAJOR_SPOILER)
                .spoilerScore(BigDecimal.valueOf(0.9))
                .spoilerSentences(List.of())
                .sanitizedReview("[REDACTED]")
                .model("heuristic-v1")
                .build();
        when(heuristicClassifier.classify(4L, 10L, "text")).thenReturn(assessment);
        when(assessmentRepository.save(any())).thenReturn(assessment);

        Review review = mock(Review.class);
        Book book = mock(Book.class);
        when(book.getId()).thenReturn(5L);
        when(review.getBook()).thenReturn(book);
        when(reviewRepository.findById(4L)).thenReturn(Optional.of(review));

        service.assessAndPersist(4L, 10L, "text");

        verify(review).setSpoilerLevel(SpoilerLevel.MAJOR_SPOILER);
        verify(review).setSpoiler(true);
        verify(reviewRepository).save(review);
    }

    @Test
    void usesHuggingFaceClassifier_whenProviderIsHuggingFaceAndEnabled() {
        ReflectionTestUtils.setField(service, "provider", "huggingface");
        when(huggingFaceClassifier.isEnabled()).thenReturn(true);

        SpoilerAssessment expected = SpoilerAssessment.builder()
                .reviewId(10L).userId(10L)
                .spoilerLevel(SpoilerLevel.MAJOR_SPOILER)
                .spoilerScore(BigDecimal.valueOf(0.95))
                .spoilerSentences(List.of())
                .sanitizedReview("[SPOILER REDACTED]")
                .model("huggingface-loreguard-ai")
                .build();
        when(huggingFaceClassifier.classify(10L, 10L, "text with spoiler")).thenReturn(expected);
        when(assessmentRepository.save(any())).thenReturn(expected);
        when(reviewRepository.findById(10L)).thenReturn(Optional.empty());

        SpoilerAssessment result = service.assessAndPersist(10L, 10L, "text with spoiler");

        assertEquals("huggingface-loreguard-ai", result.getModel());
        assertEquals(SpoilerLevel.MAJOR_SPOILER, result.getSpoilerLevel());
        verify(huggingFaceClassifier).classify(10L, 10L, "text with spoiler");
        verifyNoInteractions(llmClassifier);
    }

    @Test
    void fallsBack_whenProviderIsHuggingFaceButDisabled() {
        ReflectionTestUtils.setField(service, "provider", "huggingface");
        when(huggingFaceClassifier.isEnabled()).thenReturn(false);

        SpoilerAssessment expectedHeuristic = SpoilerAssessment.builder()
                .reviewId(11L).userId(10L)
                .spoilerLevel(SpoilerLevel.SAFE)
                .spoilerScore(BigDecimal.ZERO)
                .spoilerSentences(List.of())
                .sanitizedReview("text")
                .model("heuristic-v1")
                .build();
        when(heuristicClassifier.classify(11L, 10L, "text")).thenReturn(expectedHeuristic);
        when(assessmentRepository.save(any())).thenReturn(expectedHeuristic);
        when(reviewRepository.findById(11L)).thenReturn(Optional.empty());

        SpoilerAssessment result = service.assessAndPersist(11L, 10L, "text");

        assertEquals("heuristic-v1", result.getModel());
        verify(heuristicClassifier).classify(11L, 10L, "text");
        verify(huggingFaceClassifier, never()).classify(any(), any(), any());
    }
}
