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

    @Query(value = "SELECT b.* FROM books b LEFT JOIN categories c ON c.id = b.category_id " +
           "WHERE (CAST(:query AS TEXT) IS NULL OR LOWER(b.title) LIKE LOWER(CONCAT('%', CAST(:query AS TEXT), '%')) OR " +
           "LOWER(b.author) LIKE LOWER(CONCAT('%', CAST(:query AS TEXT), '%')) OR " +
           "LOWER(COALESCE(b.isbn, '')) LIKE LOWER(CONCAT('%', CAST(:query AS TEXT), '%'))) AND " +
           "(CAST(:categoryId AS BIGINT) IS NULL OR b.category_id = CAST(:categoryId AS BIGINT)) AND " +
           "(CAST(:minPrice AS DECIMAL) IS NULL OR b.price >= CAST(:minPrice AS DECIMAL)) AND " +
           "(CAST(:maxPrice AS DECIMAL) IS NULL OR b.price <= CAST(:maxPrice AS DECIMAL)) AND " +
           "(:inStockOnly = FALSE OR b.stock > 0) AND " +
           "(CAST(:minRating AS DOUBLE PRECISION) IS NULL OR " +
           "(SELECT AVG(r.rating) FROM reviews r WHERE r.book_id = b.id) >= CAST(:minRating AS DOUBLE PRECISION))",
           countQuery = "SELECT COUNT(*) FROM books b WHERE " +
           "(CAST(:query AS TEXT) IS NULL OR LOWER(b.title) LIKE LOWER(CONCAT('%', CAST(:query AS TEXT), '%')) OR " +
           "LOWER(b.author) LIKE LOWER(CONCAT('%', CAST(:query AS TEXT), '%')) OR " +
           "LOWER(COALESCE(b.isbn, '')) LIKE LOWER(CONCAT('%', CAST(:query AS TEXT), '%'))) AND " +
           "(CAST(:categoryId AS BIGINT) IS NULL OR b.category_id = CAST(:categoryId AS BIGINT)) AND " +
           "(CAST(:minPrice AS DECIMAL) IS NULL OR b.price >= CAST(:minPrice AS DECIMAL)) AND " +
           "(CAST(:maxPrice AS DECIMAL) IS NULL OR b.price <= CAST(:maxPrice AS DECIMAL)) AND " +
           "(:inStockOnly = FALSE OR b.stock > 0) AND " +
           "(CAST(:minRating AS DOUBLE PRECISION) IS NULL OR " +
           "(SELECT AVG(r.rating) FROM reviews r WHERE r.book_id = b.id) >= CAST(:minRating AS DOUBLE PRECISION))",
           nativeQuery = true)
    Page<Book> searchBooks(@Param("query") String query,
                           @Param("categoryId") Long categoryId,
                           @Param("minPrice") java.math.BigDecimal minPrice,
                           @Param("maxPrice") java.math.BigDecimal maxPrice,
                           @Param("inStockOnly") boolean inStockOnly,
                           @Param("minRating") Double minRating,
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
