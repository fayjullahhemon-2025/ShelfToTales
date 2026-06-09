package com.example.shelftotales.catalog.infrastructure;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.catalog.domain.BookEmbedding;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookEmbeddingRepository extends JpaRepository<BookEmbedding, Long> {

    @EntityGraph(attributePaths = {"book", "book.category"})
    @Query("SELECT e FROM BookEmbedding e WHERE e.bookId <> :excludeBookId")
    List<BookEmbedding> findAllExcluding(@Param("excludeBookId") Long excludeBookId);

    @Query(value = "SELECT book_id FROM book_embeddings WHERE book_id <> :excludeBookId AND embedding IS NOT NULL " +
                   "ORDER BY embedding <=> CAST(:vectorStr AS vector) LIMIT :limit", nativeQuery = true)
    List<Long> findSimilarBookIdsExcludingPgVector(@Param("excludeBookId") Long excludeBookId, 
                                                   @Param("vectorStr") String vectorStr, 
                                                   @Param("limit") int limit);

    @Query(value = "SELECT book_id FROM book_embeddings WHERE book_id <> :excludeBookId " +
                   "ORDER BY cosine_similarity(vector_data, :vectorStr) DESC LIMIT :limit", nativeQuery = true)
    List<Long> findSimilarBookIdsExcludingFallback(@Param("excludeBookId") Long excludeBookId, 
                                                   @Param("vectorStr") String vectorStr, 
                                                   @Param("limit") int limit);

    @Query(value = "SELECT book_id FROM book_embeddings WHERE embedding IS NOT NULL " +
                   "ORDER BY embedding <=> CAST(:vectorStr AS vector) LIMIT :limit", nativeQuery = true)
    List<Long> findSimilarBookIdsPgVector(@Param("vectorStr") String vectorStr, @Param("limit") int limit);

    @Query(value = "SELECT book_id FROM book_embeddings " +
                   "ORDER BY cosine_similarity(vector_data, :vectorStr) DESC LIMIT :limit", nativeQuery = true)
    List<Long> findSimilarBookIdsFallback(@Param("vectorStr") String vectorStr, @Param("limit") int limit);
}
