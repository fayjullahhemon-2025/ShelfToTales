package com.example.shelftotales.commerce.application;
import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.infrastructure.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CartItemResponse {
    private Long id;
    private Long bookId;
    private String title;
    private String author;
    private String coverUrl;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
}
