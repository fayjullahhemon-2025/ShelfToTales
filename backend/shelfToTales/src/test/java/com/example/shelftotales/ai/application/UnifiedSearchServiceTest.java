package com.example.shelftotales.ai.application;

import com.example.shelftotales.ai.application.UnifiedSearchResponse.SearchHit;
import com.example.shelftotales.ai.application.UnifiedSearchResponse.Signals;
import com.example.shelftotales.catalog.domain.Book;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class UnifiedSearchServiceTest {

    private final UnifiedSearchService service = new UnifiedSearchService();

    private static Book book(long id, String title) {
        Book b = new Book();
        try {
            Field idField = Book.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(b, id);
            Field titleField = Book.class.getDeclaredField("title");
            titleField.setAccessible(true);
            titleField.set(b, title);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return b;
    }

    private static SearchHit toHit(Book b) {
        return SearchHit.builder()
                .bookId(b.getId())
                .title(b.getTitle())
                .author("author")
                .coverUrl("http://x/" + b.getId())
                .categoryName("Cat")
                .price(new BigDecimal("9.99"))
                .build();
    }

    @Test
    void merge_bothListsWithOverlap_boostsOverlapAndSetsMatchedSources() {
        Book a = book(1, "A"), b = book(2, "B"), c = book(3, "C");
        List<SearchHit> text = new ArrayList<>(List.of(toHit(a), toHit(b)));
        List<Map.Entry<Book, Double>> sem = new ArrayList<>(List.of(
                Map.entry(b, 0.9), Map.entry(c, 0.8)));

        UnifiedSearchResponse resp = service.merge("q", text, sem, 0, 10, null, null, null);

        assertEquals(3, resp.getResults().size());
        SearchHit top = resp.getResults().get(0);
        assertEquals(2L, top.getBookId());
        assertTrue(top.getMatchedSources().contains("text"));
        assertTrue(top.getMatchedSources().contains("semantic"));
        assertEquals("ok", resp.getSignals().getText());
        assertEquals("ok", resp.getSignals().getSemantic());
    }

    @Test
    void merge_textOnly_returnsTextRankedResults() {
        Book a = book(1, "A"), b = book(2, "B");
        List<SearchHit> text = List.of(toHit(a), toHit(b));
        List<Map.Entry<Book, Double>> sem = List.of();

        UnifiedSearchResponse resp = service.merge("q", text, sem, 0, 10, null, null, null);

        assertEquals(2, resp.getResults().size());
        assertEquals(1L, resp.getResults().get(0).getBookId());
        assertEquals(List.of("text"), resp.getResults().get(0).getMatchedSources());
        assertNull(resp.getResults().get(0).getSemanticScore());
        assertEquals(0, resp.getResults().get(0).getTextRank());
    }

    @Test
    void merge_semanticOnly_returnsSemanticRankedResults() {
        Book a = book(1, "A"), b = book(2, "B");
        List<SearchHit> text = List.of();
        List<Map.Entry<Book, Double>> sem = new ArrayList<>(List.of(
                Map.entry(b, 0.95), Map.entry(a, 0.7)));

        UnifiedSearchResponse resp = service.merge("q", text, sem, 0, 10, null, null, null);

        assertEquals(2, resp.getResults().size());
        assertEquals(2L, resp.getResults().get(0).getBookId());
        assertEquals(List.of("semantic"), resp.getResults().get(0).getMatchedSources());
        assertEquals(0.95, resp.getResults().get(0).getSemanticScore());
        assertNull(resp.getResults().get(0).getTextRank());
    }

    @Test
    void merge_bothEmpty_returnsEmptyResultsAndOkSignals() {
        UnifiedSearchResponse resp = service.merge("q", List.of(), List.of(), 0, 10, null, null, null);

        assertTrue(resp.getResults().isEmpty());
        assertEquals(0, resp.getTotal());
        assertEquals("ok", resp.getSignals().getText());
        assertEquals("ok", resp.getSignals().getSemantic());
    }

    @Test
    void merge_paginationSlicesMergedList() {
        List<SearchHit> text = new ArrayList<>();
        List<Map.Entry<Book, Double>> sem = new ArrayList<>();
        for (int i = 0; i < 10; i++) text.add(toHit(book(i, "T" + i)));
        for (int i = 0; i < 10; i++) sem.add(Map.entry(book(i + 100, "S" + i), 0.5));

        UnifiedSearchResponse page0 = service.merge("q", text, sem, 0, 10, null, null, null);
        UnifiedSearchResponse page1 = service.merge("q", text, sem, 1, 10, null, null, null);
        UnifiedSearchResponse page2 = service.merge("q", text, sem, 2, 10, null, null, null);

        assertEquals(10, page0.getResults().size());
        assertEquals(10, page1.getResults().size());
        assertEquals(0, page2.getResults().size());
        assertEquals(20, page0.getTotal());
        assertEquals(20, page1.getTotal());
        assertEquals(20, page2.getTotal());
    }

    @Test
    void merge_overlapScoreEqualsSumOfBothContributions() {
        Book a = book(1, "A");
        SearchHit textHit = SearchHit.builder().bookId(1L).title("A").build();
        List<SearchHit> text = new ArrayList<>(List.of(textHit));
        List<Map.Entry<Book, Double>> sem = new ArrayList<>(List.of(Map.entry(a, 0.9)));

        UnifiedSearchResponse resp = service.merge("q", text, sem, 0, 10, null, null, null);

        SearchHit hit = resp.getResults().get(0);
        // rank 0 in both → 1/(60+0+1) + 1/(60+0+1) = 2/61
        assertEquals(2.0 / 61.0, hit.getScore(), 1e-9);
    }

    @Test
    void merge_sourceTextFilter_keepsOnlyTextMatches() {
        Book a = book(1, "A"), b = book(2, "B"), c = book(3, "C");
        List<SearchHit> text = new ArrayList<>(List.of(toHit(a), toHit(b)));
        List<Map.Entry<Book, Double>> sem = new ArrayList<>(List.of(
                Map.entry(b, 0.9), Map.entry(c, 0.8)));

        UnifiedSearchResponse resp = service.merge("q", text, sem, 0, 10, "text", null, null);

        assertEquals(2, resp.getTotal());
        for (SearchHit h : resp.getResults()) {
            assertTrue(h.getMatchedSources().contains("text"));
        }
    }

    @Test
    void merge_imageFilterOnlyKeepsMatchingCovers() {
        // SearchHit doesn't carry coverHash, so when imageQueryHash is non-null,
        // the current image-filter impl drops all hits. Assert that behaviour.
        Book a = book(1, "A"), b = book(2, "B");
        List<SearchHit> text = new ArrayList<>(List.of(toHit(a), toHit(b)));
        List<Map.Entry<Book, Double>> sem = List.of();

        UnifiedSearchResponse resp = service.merge("q", text, sem, 0, 10, null, null, 42L);

        assertTrue(resp.getResults().isEmpty());
        assertEquals(0, resp.getTotal());
        assertTrue(resp.isImageMatched());
    }

    @Test
    void merge_cursorAdvancesPastCursorId() {
        List<SearchHit> text = new ArrayList<>();
        List<Map.Entry<Book, Double>> sem = new ArrayList<>();
        for (int i = 0; i < 4; i++) text.add(toHit(book(i, "T" + i)));

        UnifiedSearchResponse full = service.merge("q", text, sem, 0, 10, null, null, null);
        assertEquals(4, full.getResults().size());

        String cursor = CursorCodec.encode(1L);
        UnifiedSearchResponse after = service.merge("q", text, sem, 0, 10, null, cursor, null);
        assertEquals(2, after.getResults().size());
        assertEquals(2L, after.getResults().get(0).getBookId());
        assertEquals(3L, after.getResults().get(1).getBookId());
    }

    @Test
    void merge_setsPersonalizedFalseAndFacets() {
        Book a = book(1, "A"), b = book(2, "B");
        List<SearchHit> text = List.of(toHit(a), toHit(b));
        List<Map.Entry<Book, Double>> sem = List.of();

        UnifiedSearchResponse resp = service.merge("q", text, sem, 0, 10, null, null, null);

        assertFalse(resp.isPersonalized());
        assertNotNull(resp.getFacets());
        assertNotNull(resp.getFacets().getCategories());
        assertNotNull(resp.getFacets().getAuthors());
    }
}