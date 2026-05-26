package com.example.shelftotales.event;

import lombok.Getter;

@Getter
public class BookCompletedEvent extends DomainEvent {
    private final Long bookId;
    private final String bookTitle;
    private final String bookCoverUrl;
    private final Long categoryId;

    public BookCompletedEvent(Long actorId, Long bookId, String bookTitle, String bookCoverUrl, Long categoryId) {
        super(actorId);
        this.bookId = bookId;
        this.bookTitle = bookTitle;
        this.bookCoverUrl = bookCoverUrl;
        this.categoryId = categoryId;
    }
}
