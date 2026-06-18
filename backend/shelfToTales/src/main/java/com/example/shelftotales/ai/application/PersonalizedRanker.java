package com.example.shelftotales.ai.application;

import com.example.shelftotales.ai.application.UnifiedSearchResponse.SearchHit;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.review.domain.Review;
import com.example.shelftotales.review.infrastructure.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PersonalizedRanker {

    private static final int MIN_RATING = 4;
    private static final int DAYS_LOOKBACK = 30;
    private static final double BOOST_FACTOR = 1.0;

    public record Ranked(List<SearchHit> results, boolean personalized) {}

    private final ReviewRepository reviewRepository;
    private final BookRepository bookRepository;

    /**
     * Boost hits whose book's moodTags overlap with the user's recent positive-review mood set.
     * On any failure or anonymous user, returns the input list unchanged with personalized=false.
     */
    public Ranked rank(User user, List<SearchHit> hits) {
        if (user == null || user.getId() == null || hits == null || hits.isEmpty()) {
            return new Ranked(hits, false);
        }
        try {
            Instant cutoff = Instant.now().minus(DAYS_LOOKBACK, ChronoUnit.DAYS);
            List<Review> recent = reviewRepository
                    .findByUserIdAndRatingGreaterThanEqualAndCreatedAtAfter(user.getId(), MIN_RATING, cutoff);
            if (recent.isEmpty()) {
                return new Ranked(hits, false);
            }
            Set<String> userMoods = recent.stream()
                    .map(r -> r.getBook() == null ? null : r.getBook().getMoodTags())
                    .filter(Objects::nonNull)
                    .flatMap(s -> Arrays.stream(s.split(",")))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(String::toLowerCase)
                    .collect(Collectors.toSet());
            if (userMoods.isEmpty()) {
                return new Ranked(hits, false);
            }

            final Set<String> moodsFinal = userMoods;
            List<RankedHit> ranked = new ArrayList<>();
            for (SearchHit h : hits) {
                double boost = 1.0;
                String tags = lookupMoodTags(h);
                if (tags != null && !tags.isBlank()) {
                    Set<String> hitMoods = Arrays.stream(tags.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .map(String::toLowerCase)
                            .collect(Collectors.toSet());
                    long overlap = hitMoods.stream().filter(moodsFinal::contains).count();
                    if (overlap > 0) {
                        boost = BOOST_FACTOR + (double) overlap;
                    }
                }
                SearchHit boosted = SearchHit.builder()
                        .bookId(h.getBookId())
                        .title(h.getTitle())
                        .author(h.getAuthor())
                        .coverUrl(h.getCoverUrl())
                        .categoryName(h.getCategoryName())
                        .price(h.getPrice())
                        .score(h.getScore() + boost)
                        .matchedSources(h.getMatchedSources())
                        .semanticScore(h.getSemanticScore())
                        .textRank(h.getTextRank())
                        .build();
                ranked.add(new RankedHit(boosted, boost));
            }
            ranked.sort(Comparator.<RankedHit, Double>comparing(r -> r.hit().getScore()).reversed());
            return new Ranked(ranked.stream().map(RankedHit::hit).collect(Collectors.toList()), true);
        } catch (RuntimeException e) {
            log.warn("PersonalizedRanker: failed to rank, returning input unchanged: {}", e.getMessage());
            return new Ranked(hits, false);
        }
    }

    private String lookupMoodTags(SearchHit h) {
        if (h == null || h.getBookId() == null) {
            return null;
        }
        try {
            Book book = bookRepository.findById(h.getBookId()).orElse(null);
            return book == null ? null : book.getMoodTags();
        } catch (RuntimeException e) {
            log.warn("PersonalizedRanker: failed to look up moodTags for bookId={}: {}", h.getBookId(), e.getMessage());
            return null;
        }
    }

    private record RankedHit(SearchHit hit, double boost) {}
}
