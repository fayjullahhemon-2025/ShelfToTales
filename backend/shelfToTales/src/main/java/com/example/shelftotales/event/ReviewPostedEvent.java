package com.example.shelftotales.event;

import lombok.Getter;

@Getter
public class ReviewPostedEvent extends DomainEvent {
    private final Long reviewId;
    private final Long bookId;
    private final String bookTitle;

    public ReviewPostedEvent(Long actorId, Long reviewId, Long bookId, String bookTitle) {
        super(actorId);
        this.reviewId = reviewId;
        this.bookId = bookId;
        this.bookTitle = bookTitle;
    }
}
