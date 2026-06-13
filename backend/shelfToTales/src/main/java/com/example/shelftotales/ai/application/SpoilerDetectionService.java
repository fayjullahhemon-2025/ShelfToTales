package com.example.shelftotales.ai.application;

import com.example.shelftotales.ai.domain.SpoilerAssessment;
import com.example.shelftotales.ai.domain.SpoilerLevel;
import com.example.shelftotales.ai.infrastructure.SpoilerAssessmentRepository;
import com.example.shelftotales.review.infrastructure.ReviewRepository;
import com.example.shelftotales.review.domain.Review;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SpoilerDetectionService {

    private final HeuristicSpoilerClassifier heuristicClassifier;
    private final SpoilerAssessmentRepository assessmentRepository;
    private final ReviewRepository reviewRepository;
    private final Optional<LlmSpoilerClassifier> llmClassifier;
    private final Optional<BookSpoilerClassifier> bookClassifier;
    private final Optional<TransformerSpoilerClassifier> transformerClassifier;
    private final Optional<HuggingFaceSpoilerClassifier> huggingFaceClassifier;
    private final SpoilerModelRegistry modelRegistry;
    private final TrainingTriggerService trainingTriggerService;

    @Value("${ai.spoiler.provider:heuristic}")
    private String provider;

    /**
     * Assess a review for spoilers and persist the result.
     * Automatically triggers training readiness check after assessment.
     */
    @Transactional
    public SpoilerAssessment assessAndPersist(Long reviewId, Long userId, String text) {
        Long bookId = resolveBookId(reviewId);
        return doAssessAndPersist(reviewId, userId, bookId, text);
    }

    /**
     * Assess a review with explicit bookId (for when caller knows the book).
     */
    @Transactional
    public SpoilerAssessment assessAndPersist(Long reviewId, Long userId, Long bookId, String text) {
        return doAssessAndPersist(reviewId, userId, bookId, text);
    }

    private SpoilerAssessment doAssessAndPersist(Long reviewId, Long userId, Long bookId, String text) {
        long start = System.currentTimeMillis();

        modelRegistry.setCurrentBookId(bookId);
        try {
            SpoilerAssessment assessment = classifyWithFallback(bookId, reviewId, userId, text);
            long latency = System.currentTimeMillis() - start;
            assessment.setLatencyMs((int) latency);

            SpoilerAssessment saved = assessmentRepository.save(assessment);

            reviewRepository.findById(reviewId).ifPresent(review -> {
                review.setSpoilerLevel(saved.getSpoilerLevel());
                review.setSpoiler(saved.getSpoilerLevel() != SpoilerLevel.SAFE);
                reviewRepository.save(review);
            });

            log.info("Spoiler assessment for review={} book={} level={} score={} latencyMs={} model={}",
                    reviewId, bookId, saved.getSpoilerLevel(), saved.getSpoilerScore(), latency, saved.getModel());

            if (bookId != null) {
                trainingTriggerService.checkAndTriggerTraining(bookId);
            }

            return saved;
        } finally {
            modelRegistry.clearCurrentBookId();
        }
    }

    @Transactional(readOnly = true)
    public Optional<SpoilerAssessment> getLatest(Long reviewId) {
        return assessmentRepository.findByReviewId(reviewId);
    }

    /**
     * Pick the appropriate classifier based on config and model availability.
     *
     * Priority:
     * 1. book-llm: Use book-specific fine-tuned model (if configured and available)
     * 2. transformer: Use ONNX transformer model (if loaded)
     * 3. llm: Use generic LLM (if configured)
     * 4. heuristic: Use regex-based classifier (default)
     */
    private SpoilerClassifier pickClassifier(Long bookId) {
        if ("huggingface".equalsIgnoreCase(provider) && huggingFaceClassifier.isPresent() && huggingFaceClassifier.get().isEnabled()) {
            return huggingFaceClassifier.get();
        }

        // Book-specific classifier takes priority if configured
        if ("book-llm".equalsIgnoreCase(provider) && bookClassifier.isPresent()) {
            if (bookId != null && modelRegistry.hasActiveModel(bookId)) {
                log.debug("Using book-specific classifier for book {}", bookId);
                return bookClassifier.get();
            }
            // Fall through to generic LLM if no book model
        }

        // Transformer classifier (ONNX model) if loaded
        if (transformerClassifier.isPresent() && transformerClassifier.get().isModelAvailable()) {
            log.debug("Using transformer classifier");
            return transformerClassifier.get();
        }

        // Generic LLM classifier
        if ("llm".equalsIgnoreCase(provider) && llmClassifier.isPresent()) {
            return llmClassifier.get();
        }

        // Default: heuristic
        return heuristicClassifier;
    }

    private SpoilerAssessment classifyWithFallback(Long bookId, Long reviewId, Long userId, String text) {
        SpoilerClassifier primary = pickClassifier(bookId);
        SpoilerAssessment result = primary.classify(reviewId, userId, text);
        if (result.getSpoilerLevel() == SpoilerLevel.SAFE
                && BigDecimal.ZERO.compareTo(result.getSpoilerScore()) == 0
                && text != null && !text.isBlank()
                && !(primary instanceof HeuristicSpoilerClassifier)) {
            log.debug("Primary classifier {} returned zero-score SAFE, falling back to heuristic",
                    primary.modelId());
            result = heuristicClassifier.classify(reviewId, userId, text);
        }
        return result;
    }

    /**
     * Resolve bookId from a reviewId.
     */
    private Long resolveBookId(Long reviewId) {
        return reviewRepository.findById(reviewId)
                .map(review -> review.getBook().getId())
                .orElse(null);
    }
}
