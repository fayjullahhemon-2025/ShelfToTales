package com.example.shelftotales.bookshelf.application.strategy;

import com.example.shelftotales.bookshelf.domain.ShelfBook;

/**
 * Strategy pattern: defines how a reading status transition is handled.
 * Each implementation validates the transition and applies side effects.
 */
public interface ReadingStatusTransitionStrategy {

    /**
     * @return the target status this strategy transitions to
     */
    String getTargetStatus();

    /**
     * Validate whether the transition is allowed from current state.
     */
    boolean canTransitionFrom(String currentStatus);

    /**
     * Apply the transition (update status + any side effects).
     */
    void apply(ShelfBook shelfBook);
}
