package com.example.shelftotales.bookshelf.application;

import com.example.shelftotales.ai.application.AIService;
import com.example.shelftotales.ai.application.EmbeddingService;
import com.example.shelftotales.ai.domain.UserProfileVector;
import com.example.shelftotales.ai.infrastructure.UserProfileVectorRepository;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.domain.BookEmbedding;
import com.example.shelftotales.catalog.infrastructure.BookEmbeddingRepository;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardRecommendationService {

    private final UserProfileVectorRepository profileVectorRepository;
    private final EmbeddingService embeddingService;
    private final BookEmbeddingRepository bookEmbeddingRepository;
    private final AIService aiService;
    private final BookRepository bookRepository;

    @Transactional(readOnly = true)
    public List<RecommendedBookDTO> getDashboardRecommendations(Long userId) {
        return safeGet(() -> {
            Optional<UserProfileVector> profileOpt = profileVectorRepository.findById(userId);
            if (profileOpt.isEmpty()) {
                return getFallbackRecommendations();
            }

            double[] userVec = aiService.stringToVector(profileOpt.get().getVectorData());
            List<Long> matchedIds = embeddingService.getSimilarBookIds(userVec, 3);
            if (matchedIds.isEmpty()) {
                return getFallbackRecommendations();
            }

            List<BookEmbedding> embeddings = bookEmbeddingRepository.findAllById(matchedIds);
            if (embeddings.isEmpty()) {
                return getFallbackRecommendations();
            }

            return embeddings.stream()
                .map(emb -> {
                    double score = aiService.calculateSimilarity(userVec, aiService.stringToVector(emb.getVectorData()));
                    Book book = emb.getBook();
                    return RecommendedBookDTO.builder()
                        .bookId(book.getId())
                        .title(book.getTitle())
                        .author(book.getAuthor())
                        .coverUrl(book.getCoverUrl())
                        .score(Math.max(0.0, Math.min(1.0, score)))
                        .reason(generateReason(book, score))
                        .matchCategory(generateMatchCategory(book, score))
                        .build();
                })
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .collect(Collectors.toList());
        }, Collections.emptyList());
    }

    private String generateReason(Book book, double score) {
        if (score > 0.9) return "Strongly matches your reading taste";
        if (score > 0.7) return "Great match based on your profile";
        if (book.getCategory() != null) return "Trending in " + book.getCategory().getName();
        return "Recommended based on your interests";
    }

    private String generateMatchCategory(Book book, double score) {
        if (score > 0.9) return "Top Pick";
        if (score > 0.7) return "Great Match";
        if (book.getCategory() != null) return book.getCategory().getName();
        return "For You";
    }

    private List<RecommendedBookDTO> getFallbackRecommendations() {
        return bookRepository.findAll(PageRequest.of(0, 3)).getContent().stream()
            .map(b -> RecommendedBookDTO.builder()
                .bookId(b.getId()).title(b.getTitle()).author(b.getAuthor())
                .coverUrl(b.getCoverUrl()).score(0.5)
                .reason("Trending in our Bookstore")
                .matchCategory("Popular")
                .build())
            .collect(Collectors.toList());
    }

    private <T> T safeGet(Supplier<T> supplier, T fallback) {
        try {
            return supplier.get();
        } catch (Exception e) {
            log.warn("Dashboard recommendation aggregation failed", e);
            return fallback;
        }
    }
}
