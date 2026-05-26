package com.example.shelftotales.commerce.application;
import com.example.shelftotales.catalog.application.CategoryResponse;
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
public class OrderItemResponse {
    private Long id;
    private Long bookId;
    private String bookTitle;
    private String bookImageUrl;
    private int quantity;
    private BigDecimal price;
    private CategoryResponse category;
}
