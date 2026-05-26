package com.example.shelftotales.bookshelf.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardResponse {
    private String fullName;
    private String email;
    private String profileImageUrl;
    private LocalDate memberSince;

    private int totalBooksReading;
    private int totalBooksCompleted;
    private int totalPagesRead;
    private List<CurrentlyReadingDTO> currentlyReading;

    private int totalBookshelves;
    private int totalBooksOwned;
    private int totalCategoriesOwned;
    private List<CategoryBreakdownDTO> booksByCategory;

    private int cartItemCount;
    private BigDecimal cartTotalValue;
    private int wishlistCount;
    private int totalOrders;
    private BigDecimal totalSpent;

    private List<RecentActivityDTO> recentActivities;
}
