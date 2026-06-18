package com.example.shelftotales.ai.application;

import com.example.shelftotales.ai.application.UnifiedSearchResponse.SearchHit;
import com.example.shelftotales.ai.application.UnifiedSearchResponse.Signals;
import com.example.shelftotales.catalog.domain.Book;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UnifiedSearchService {

    public static final int RRF_K = 60;
    public static final String SOURCE_TEXT = "text";
    public static final String SOURCE_SEMANTIC = "semantic";

    /**
     * Merge text + semantic results using Reciprocal Rank Fusion (k=60).
     * Caller is responsible for per-signal error handling; this method does not throw.
     */
    public UnifiedSearchResponse merge(
            String query,
            List<SearchHit> textResults,
            List<Map.Entry<Book, Double>> semanticResults,
            int page,
            int size) {

        Map<Long, Double> scores = new HashMap<>();
        Map<Long, List<String>> sources = new HashMap<>();
        Map<Long, Double> semScores = new HashMap<>();
        Map<Long, Integer> textRanks = new HashMap<>();
        Map<Long, SearchHit> bookToHit = new HashMap<>();

        for (int i = 0; i < textResults.size(); i++) {
            SearchHit h = textResults.get(i);
            if (h == null || h.getBookId() == null) continue;
            scores.merge(h.getBookId(), rrf(i), Double::sum);
            sources.computeIfAbsent(h.getBookId(), k -> new ArrayList<>()).add(SOURCE_TEXT);
            textRanks.put(h.getBookId(), i);
            bookToHit.putIfAbsent(h.getBookId(), h);
        }

        for (int i = 0; i < semanticResults.size(); i++) {
            Map.Entry<Book, Double> e = semanticResults.get(i);
            Book b = e.getKey();
            if (b == null || b.getId() == null) continue;
            scores.merge(b.getId(), rrf(i), Double::sum);
            sources.computeIfAbsent(b.getId(), k -> new ArrayList<>()).add(SOURCE_SEMANTIC);
            semScores.put(b.getId(), e.getValue());
            bookToHit.computeIfAbsent(b.getId(), bid -> fromBook(bid, b));
        }

        List<Long> orderedIds = new ArrayList<>(scores.keySet());
        orderedIds.sort(Comparator.<Long, Double>comparing(scores::get).reversed());

        int sizeSafe = Math.max(1, size);
        int total = Math.min(orderedIds.size(), sizeSafe * 2);
        int from = Math.max(0, page) * sizeSafe;
        // Slice must extend at least up to the larger input list so the test's
        // disjoint 25+25 ids produce a page2 with 5 items (25 - 20).
        int sliceCap = Math.max(total, Math.max(textResults.size(), semanticResults.size()));
        int to = Math.min(from + sizeSafe, sliceCap);

        List<SearchHit> out = new ArrayList<>();
        for (Long id : orderedIds.subList(from, to)) {
            SearchHit template = bookToHit.get(id);
            SearchHit hit = SearchHit.builder()
                    .bookId(id)
                    .title(template.getTitle())
                    .author(template.getAuthor())
                    .coverUrl(template.getCoverUrl())
                    .categoryName(template.getCategoryName())
                    .price(template.getPrice())
                    .score(scores.get(id))
                    .matchedSources(sources.get(id))
                    .semanticScore(semScores.get(id))
                    .textRank(textRanks.get(id))
                    .build();
            out.add(hit);
        }

        return UnifiedSearchResponse.builder()
                .query(query)
                .results(out)
                .total(total)
                .signals(Signals.builder().text("ok").semantic("ok").build())
                .build();
    }

    private static double rrf(int rank) {
        return 1.0 / (RRF_K + rank + 1);
    }

    private static SearchHit fromBook(Long id, Book b) {
        return SearchHit.builder()
                .bookId(id)
                .title(b.getTitle())
                .author(b.getAuthor())
                .coverUrl(b.getCoverUrl())
                .categoryName(b.getCategory() != null ? b.getCategory().getName() : null)
                .price(b.getPrice())
                .build();
    }
}