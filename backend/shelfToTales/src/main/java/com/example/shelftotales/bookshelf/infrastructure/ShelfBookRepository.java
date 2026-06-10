package com.example.shelftotales.bookshelf.infrastructure;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.bookshelf.domain.ShelfBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShelfBookRepository extends JpaRepository<ShelfBook, Long> {
    @Query("SELECT sb FROM ShelfBook sb JOIN FETCH sb.book WHERE sb.bookshelf.id = :shelfId ORDER BY sb.addedAt ASC")
    List<ShelfBook> findByBookshelfIdWithBook(@Param("shelfId") Long shelfId);

    Optional<ShelfBook> findByBookshelfIdAndBookId(Long shelfId, Long bookId);
    boolean existsByBookshelfIdAndBookId(Long shelfId, Long bookId);
    int countByBookshelfId(Long shelfId);
    void deleteByBookshelfIdAndBookId(Long shelfId, Long bookId);

    /**
     * Batch count of books per bookshelf to avoid N+1 queries when listing shelves.
     * Returns rows of [shelfId, count].
     */
    @Query("SELECT sb.bookshelf.id, COUNT(sb) FROM ShelfBook sb WHERE sb.bookshelf.id IN :shelfIds GROUP BY sb.bookshelf.id")
    List<Object[]> countByBookshelfIdIn(@Param("shelfIds") List<Long> shelfIds);

    @Query("SELECT COUNT(DISTINCT sb.book.id) FROM ShelfBook sb WHERE sb.bookshelf.user.id = :userId")
    int countDistinctBookIdsByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(sb) FROM ShelfBook sb WHERE sb.bookshelf.user.id = :userId AND sb.readingStatus = :status")
    long countByBookshelfUserIdAndReadingStatus(@Param("userId") Long userId, @Param("status") String status);

    @Query("SELECT sb.book.id FROM ShelfBook sb WHERE sb.bookshelf.user.id = :userId AND sb.readingStatus = 'COMPLETED'")
    java.util.List<Long> findCompletedBookIdsByUserId(@Param("userId") Long userId);

    @Query("SELECT sb.book.id FROM ShelfBook sb WHERE sb.bookshelf.user.id = :userId AND sb.readingStatus = :status")
    java.util.List<Long> findBookIdsByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);
}
