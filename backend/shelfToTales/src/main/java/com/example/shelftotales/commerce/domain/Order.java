package com.example.shelftotales.commerce.domain;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.catalog.domain.Book;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {
    private static final int MAX_ITEMS_PER_ORDER = 50;

    private static final Map<OrderStatus, Set<OrderStatus>> VALID_TRANSITIONS = Map.of(
            OrderStatus.PENDING, Set.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
            OrderStatus.CONFIRMED, Set.of(OrderStatus.SHIPPED, OrderStatus.CANCELLED),
            OrderStatus.SHIPPED, Set.of(OrderStatus.DELIVERED),
            OrderStatus.DELIVERED, Set.of(),
            OrderStatus.CANCELLED, Set.of()
    );

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime orderDate;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @Column(name = "tracking_number", length = 50)
    private String trackingNumber;

    @Column(name = "payment_method", length = 20)
    @Builder.Default
    private String paymentMethod = "COD";

    @Column(name = "coupon_code", length = 30)
    private String couponCode;

    @Column(name = "discount_amount", precision = 10, scale = 2)
    @Builder.Default
    private java.math.BigDecimal discountAmount = java.math.BigDecimal.ZERO;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    // ─── Domain Logic ───────────────────────────────────────────────

    /**
     * Add item to order. Enforces max items and prevents modification after confirmation.
     */
    public void addItem(Book book, int quantity, BigDecimal unitPrice) {
        if (status != OrderStatus.PENDING && status != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Cannot modify order in status: " + status);
        }
        if (items.size() >= MAX_ITEMS_PER_ORDER) {
            throw new IllegalStateException("Order cannot exceed " + MAX_ITEMS_PER_ORDER + " items");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }

        OrderItem item = OrderItem.builder()
                .order(this)
                .book(book)
                .quantity(quantity)
                .price(unitPrice)
                .build();
        items.add(item);
        recalculateTotal();
    }

    /**
     * Transition order status. Enforces valid state machine transitions.
     */
    public void transitionTo(OrderStatus newStatus) {
        Set<OrderStatus> allowed = VALID_TRANSITIONS.get(this.status);
        if (allowed == null || !allowed.contains(newStatus)) {
            throw new IllegalStateException(
                    "Cannot transition from " + this.status + " to " + newStatus);
        }
        this.status = newStatus;
    }

    /**
     * Recalculate total from items.
     */
    public void recalculateTotal() {
        this.totalAmount = items.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public boolean isCancellable() {
        return status == OrderStatus.PENDING || status == OrderStatus.CONFIRMED;
    }
}
