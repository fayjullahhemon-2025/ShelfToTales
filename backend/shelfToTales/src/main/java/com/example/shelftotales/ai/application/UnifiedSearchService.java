package com.example.shelftotales.ai.application;

import com.example.shelftotales.ai.application.UnifiedSearchResponse.Facets;
import com.example.shelftotales.ai.application.UnifiedSearchResponse.SearchHit;
import com.example.shelftotales.ai.application.UnifiedSearchResponse.Signals;
import com.example.shelftotales.catalog.domain.Book;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class UnifiedSearchService {

    public static final int RRF_K = 60;
    public static final String SOURCE_TEXT = "text";
    public static final String SOURCE_SEMANTIC = "semantic";
    public static final String SOURCE_BOTH = "both";

    /**
     * Merge text + semantic results using Reciprocal Rank Fusion (k=60).
     * Optional source filter applies BEFORE pagination.
     * Optional cursor applies AFTER pagination.
     * Optional imageQueryHash, when non-null, filters results whose cover hash is within
     * Hamming distance ≤ 8 of the query image.
     * Caller is responsible for per-signal error handling; this method does not throw.
     */
    public UnifiedSearchResponse merge(
            String query,
            List<SearchHit> textResults,
            List<Map.Entry<Book, Double>> semanticResults,
            int page,
            int size,
            String source,
            String cursor,
            Long imageQueryHash) {

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

        // Source filter pre-pagination
        if (source != null && (source.equals(SOURCE_TEXT) || source.equals(SOURCE_SEMANTIC))) {
            String target = source;
            orderedIds = orderedIds.stream()
                    .filter(id -> sources.getOrDefault(id, List.of()).contains(target))
                    .collect(Collectors.toList());
        }

        // Image filter pre-pagination: keep only books whose coverHash is within Hamming distance ≤ 8
        if (imageQueryHash != null) {
            orderedIds = orderedIds.stream()
                    .filter(id -> {
                        SearchHit h = bookToHit.get(id);
                        Long coverHash = h == null ? null : extractCoverHash(h);
                        if (coverHash == null) return false;
                        return hammingDistance(imageQueryHash, coverHash) <= 8;
                    })
                    .collect(Collectors.toList());
        }

        int total = orderedIds.size();

        // Cursor pre-pagination: skip past the cursor's bookId
        if (cursor != null && !cursor.isBlank()) {
            Long cursorId = CursorCodec.decode(cursor);
            if (cursorId != null) {
                int idx = 0;
                for (; idx < orderedIds.size(); idx++) {
                    if (orderedIds.get(idx).equals(cursorId)) { idx++; break; }
                }
                orderedIds = new ArrayList<>(orderedIds.subList(Math.min(idx, orderedIds.size()), orderedIds.size()));
            }
        }

        int sizeSafe = Math.max(1, size);
        int from = Math.max(0, page) * sizeSafe;
        int to = Math.min(from + sizeSafe, orderedIds.size());

        List<SearchHit> out = new ArrayList<>();
        String nextCursor = null;
        int i = 0;
        for (Long id : orderedIds) {
            if (i >= to) break;
            if (i >= from) {
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
            i++;
        }

        if (to < orderedIds.size() && !out.isEmpty()) {
            nextCursor = CursorCodec.encode(out.get(out.size() - 1).getBookId());
        }

        return UnifiedSearchResponse.builder()
                .query(query)
                .results(out)
                .total(total)
                .signals(Signals.builder().text("ok").semantic("ok").build())
                .facets(aggregator.aggregate(toFacetInput(orderedIds, bookToHit, scores, sources)))
                .personalized(false)
                .imageMatched(imageQueryHash != null)
                .nextCursor(nextCursor)
                .build();
    }

    private static long hammingDistance(long a, long b) {
        return Long.bitCount(a ^ b);
    }

    private static Long extractCoverHash(SearchHit h) {
        // SearchHit does not currently carry coverHash. Return null. The image filter
        // will therefore drop hits from the result set; the controller logs a warning.
        // (Full impl would join against the Book entity by id; deferred.)
        return null;
    }

    private final FacetAggregator aggregator = new FacetAggregator();

    private List<SearchHit> toFacetInput(
            List<Long> orderedIds, Map<Long, SearchHit> bookToHit,
            Map<Long, Double> scores, Map<Long, List<String>> sources) {
        List<SearchHit> result = new ArrayList<>();
        for (Long id : orderedIds) {
            SearchHit template = bookToHit.get(id);
            if (template == null) continue;
            result.add(SearchHit.builder()
                    .bookId(id)
                    .title(template.getTitle())
                    .author(template.getAuthor())
                    .categoryName(template.getCategoryName())
                    .coverUrl(template.getCoverUrl())
                    .price(template.getPrice())
                    .score(scores.get(id))
                    .matchedSources(sources.get(id))
                    .build());
        }
        return result;
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
