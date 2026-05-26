package com.example.shelftotales.bookshelf.application.strategy;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.bookshelf.domain.ShelfBook;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Transition to COMPLETED. Allowed only from IN_PROGRESS.
 */
@Component
public class CompleteReadingStrategy implements ReadingStatusTransitionStrategy {

    private static final Set<String> ALLOWED_FROM = Set.of("IN_PROGRESS");

    @Override
    public String getTargetStatus() {
        return "COMPLETED";
    }

    @Override
    public boolean canTransitionFrom(String currentStatus) {
        return ALLOWED_FROM.contains(currentStatus);
    }

    @Override
    public void apply(ShelfBook shelfBook) {
        shelfBook.setReadingStatus("COMPLETED");
    }
}
