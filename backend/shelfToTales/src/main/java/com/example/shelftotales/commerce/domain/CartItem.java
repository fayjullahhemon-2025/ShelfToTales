package com.example.shelftotales.commerce.domain;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.catalog.domain.Book;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cart_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {
    private static final int MAX_QUANTITY_PER_ITEM = 99;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(nullable = false)
    private int quantity;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ─── Domain Logic ───────────────────────────────────────────────

    /**
     * Update quantity with validation.
     */
    public void updateQuantity(int newQuantity) {
        validateQuantity(newQuantity);
        this.quantity = newQuantity;
    }

    /**
     * Increment quantity by amount.
     */
    public void addQuantity(int amount) {
        validateQuantity(this.quantity + amount);
        this.quantity += amount;
    }

    /**
     * Calculate subtotal for this cart item.
     */
    public BigDecimal getSubtotal() {
        BigDecimal price = (book != null && book.getPrice() != null) ? book.getPrice() : BigDecimal.ZERO;
        return price.multiply(BigDecimal.valueOf(quantity));
    }

    /**
     * Check if requested quantity is available in stock.
     */
    public void validateStockAvailability() {
        if (book != null && book.getStock() < quantity) {
            throw new IllegalArgumentException("Insufficient stock for '" + book.getTitle()
                    + "'. Available: " + book.getStock() + ", requested: " + quantity);
        }
    }

    private void validateQuantity(int qty) {
        if (qty <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        if (qty > MAX_QUANTITY_PER_ITEM) {
            throw new IllegalArgumentException("Quantity cannot exceed " + MAX_QUANTITY_PER_ITEM);
        }
    }
}
