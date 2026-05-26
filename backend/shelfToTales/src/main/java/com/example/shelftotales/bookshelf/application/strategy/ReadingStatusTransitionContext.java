package com.example.shelftotales.bookshelf.application.strategy;

import com.example.shelftotales.bookshelf.domain.ShelfBook;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Context class for Strategy pattern.
 * Resolves the correct transition strategy and applies it.
 */
@Component
public class ReadingStatusTransitionContext {

    private final Map<String, ReadingStatusTransitionStrategy> strategies;

    public ReadingStatusTransitionContext(List<ReadingStatusTransitionStrategy> strategyList) {
        this.strategies = strategyList.stream()
                .collect(Collectors.toMap(
                        ReadingStatusTransitionStrategy::getTargetStatus,
                        Function.identity()
                ));
    }

    /**
     * Transition a ShelfBook to a new reading status using the appropriate strategy.
     *
     * @throws IllegalArgumentException if target status is unknown
     * @throws IllegalStateException if transition is not allowed from current status
     */
    public void transition(ShelfBook shelfBook, String targetStatus) {
        ReadingStatusTransitionStrategy strategy = strategies.get(targetStatus);
        if (strategy == null) {
            throw new IllegalArgumentException("Unknown reading status: " + targetStatus);
        }
        if (!strategy.canTransitionFrom(shelfBook.getReadingStatus())) {
            throw new IllegalStateException(
                    "Cannot transition from " + shelfBook.getReadingStatus() + " to " + targetStatus);
        }
        strategy.apply(shelfBook);
    }
}
