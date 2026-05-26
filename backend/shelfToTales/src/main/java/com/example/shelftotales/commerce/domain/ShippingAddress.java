package com.example.shelftotales.commerce.domain;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.catalog.domain.Book;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "shipping_addresses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ShippingAddress {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(name = "address_line", nullable = false, length = 200)
    private String addressLine;

    @Column(nullable = false, length = 50)
    private String city;

    @Column(length = 100)
    private String area;

    @Column(name = "postal_code", length = 10)
    private String postalCode;

    @Column(name = "is_default")
    @Builder.Default
    private boolean isDefault = false;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
