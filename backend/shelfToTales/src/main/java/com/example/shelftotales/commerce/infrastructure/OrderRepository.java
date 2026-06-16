package com.example.shelftotales.commerce.infrastructure;

import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.auth.domain.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.book b LEFT JOIN FETCH b.category WHERE o.user.id = :userId ORDER BY o.orderDate DESC")
    List<Order> findByUserIdOrderByOrderDateDesc(@Param("userId") Long userId);

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.book b LEFT JOIN FETCH b.category WHERE o.id = :orderId AND o.user.id = :userId")
    Optional<Order> findByIdAndUserIdWithItems(@Param("orderId") Long orderId, @Param("userId") Long userId);

    long countByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.user.id = :userId")
    BigDecimal sumTotalAmountByUserId(Long userId);

    boolean existsByUserIdAndItemsBookId(Long userId, Long bookId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(o) > 0 FROM Order o JOIN o.items i WHERE o.user.id = :userId AND i.book.id = :bookId AND o.status = :status")
    boolean existsByUserIdAndItemsBookIdAndStatus(
            @org.springframework.data.repository.query.Param("userId") Long userId, 
            @org.springframework.data.repository.query.Param("bookId") Long bookId, 
            @org.springframework.data.repository.query.Param("status") OrderStatus status);

    @Query("SELECT DISTINCT i.book.id FROM Order o JOIN o.items i WHERE o.user.id = :userId AND o.status <> 'CANCELLED'")
    java.util.List<Long> findBoughtBookIdsByUserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT i.book.id FROM Order o JOIN o.items i WHERE o.user.id = :userId AND o.status = 'DELIVERED'")
    java.util.List<Long> findDeliveredBookIdsByUserId(@Param("userId") Long userId);
}
