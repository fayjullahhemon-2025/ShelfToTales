package com.example.shelftotales.wishlist.infrastructure;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.wishlist.domain.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {
    @Query("SELECT w FROM WishlistItem w JOIN FETCH w.book WHERE w.user.id = :userId ORDER BY w.addedAt DESC")
    List<WishlistItem> findByUserIdWithBook(@Param("userId") Long userId);

    Optional<WishlistItem> findByUserIdAndBookId(Long userId, Long bookId);
    void deleteByUserIdAndBookId(Long userId, Long bookId);

    long countByUserId(Long userId);
}
