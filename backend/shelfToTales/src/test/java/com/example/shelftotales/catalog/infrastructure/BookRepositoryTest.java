package com.example.shelftotales.catalog.infrastructure;

import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.domain.Category;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
class BookRepositoryTest {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    void searchBooks_matchesIsbn() {
        Category category = categoryRepository.save(Category.builder()
                .name("Fiction")
                .description("Stories")
                .build());

        bookRepository.save(Book.builder()
                .title("Test Book")
                .author("Test Author")
                .isbn("9780306406157")
                .description("A test book")
                .coverUrl("https://example.com/cover.jpg")
                .publishedDate(LocalDate.of(2024, 1, 1))
                .price(BigDecimal.valueOf(12.50))
                .stock(3)
                .category(category)
                .build());

        Page<Book> byIsbn = bookRepository.searchBooks("9780306406157", null, PageRequest.of(0, 10));

        assertEquals(1, byIsbn.getTotalElements());
        assertEquals("9780306406157", byIsbn.getContent().get(0).getIsbn());
    }
}
