package com.example.shelftotales.bookshelf.application.strategy;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.bookshelf.domain.ShelfBook;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Transition to IN_PROGRESS. Allowed from NOT_STARTED or PAUSED.
 */
@Component
public class StartReadingStrategy implements ReadingStatusTransitionStrategy {

    private static final Set<String> ALLOWED_FROM = Set.of("NOT_STARTED", "PAUSED");

    @Override
    public String getTargetStatus() {
        return "IN_PROGRESS";
    }

    @Override
    public boolean canTransitionFrom(String currentStatus) {
        return ALLOWED_FROM.contains(currentStatus);
    }

    @Override
    public void apply(ShelfBook shelfBook) {
        shelfBook.setReadingStatus("IN_PROGRESS");
    }
}
