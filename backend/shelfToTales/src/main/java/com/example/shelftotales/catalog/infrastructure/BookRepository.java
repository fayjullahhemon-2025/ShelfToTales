package com.example.shelftotales.catalog.infrastructure;

import com.example.shelftotales.bookshelf.application.CategoryBreakdownDTO;
import com.example.shelftotales.catalog.domain.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    @EntityGraph(attributePaths = {"category"})
    @Query("SELECT b FROM Book b WHERE " +
           "(:query IS NULL OR LOWER(CAST(b.title AS string)) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
           "LOWER(CAST(b.author AS string)) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))) AND " +
           "(:categoryId IS NULL OR b.category.id = :categoryId)")
    Page<Book> searchBooks(@Param("query") String query,
                           @Param("categoryId") Long categoryId,
                           Pageable pageable);

    @Query("SELECT COUNT(b) FROM Book b WHERE b.category.id = :categoryId")
    long countByCategoryId(@Param("categoryId") Long categoryId);

    Optional<Book> findByIdAndPdfUrlIsNotNull(Long id);

    @Query("SELECT b FROM Book b WHERE b.moodTags IS NOT NULL AND LOWER(b.moodTags) LIKE LOWER(CONCAT('%', :mood, '%'))")
    java.util.List<Book> findByMood(@Param("mood") String mood);

    @Query("SELECT COUNT(DISTINCT c.id) FROM ShelfBook sb JOIN sb.book b JOIN b.category c WHERE sb.bookshelf.user.id = :userId")
    int countDistinctCategoriesByUserId(@Param("userId") Long userId);

    @Query("SELECT new com.example.shelftotales.bookshelf.application.CategoryBreakdownDTO(c.name, COUNT(b)) " +
           "FROM ShelfBook sb JOIN sb.book b JOIN b.category c WHERE sb.bookshelf.user.id = :userId GROUP BY c.name")
    List<CategoryBreakdownDTO> findCategoryBreakdownByUserId(@Param("userId") Long userId);
}
