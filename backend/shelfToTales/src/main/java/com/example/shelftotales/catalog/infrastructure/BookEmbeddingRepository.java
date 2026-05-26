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
}
