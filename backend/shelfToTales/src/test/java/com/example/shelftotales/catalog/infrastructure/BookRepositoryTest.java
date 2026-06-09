package com.example.shelftotales.catalog.infrastructure;

import com.example.shelftotales.auth.domain.Role;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.domain.Category;
import com.example.shelftotales.review.domain.Review;
import com.example.shelftotales.review.infrastructure.ReviewRepository;
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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReviewRepository reviewRepository;

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

        Page<Book> byIsbn = bookRepository.searchBooks("9780306406157", null, null, null, false, null, PageRequest.of(0, 10));

        assertEquals(1, byIsbn.getTotalElements());
        assertEquals("9780306406157", byIsbn.getContent().get(0).getIsbn());
    }

    @Test
    void searchBooks_filtersPriceAndStockServerSide() {
        Category category = categoryRepository.save(Category.builder()
                .name("Science")
                .description("Science books")
                .build());

        bookRepository.save(Book.builder()
                .title("In Stock Midrange")
                .author("Author One")
                .isbn("1111111111")
                .description("Matches price and stock")
                .coverUrl("https://example.com/1.jpg")
                .publishedDate(LocalDate.of(2024, 1, 1))
                .price(BigDecimal.valueOf(15.00))
                .stock(5)
                .category(category)
                .build());

        bookRepository.save(Book.builder()
                .title("Out of Stock")
                .author("Author Two")
                .isbn("2222222222")
                .description("Same price but unavailable")
                .coverUrl("https://example.com/2.jpg")
                .publishedDate(LocalDate.of(2024, 1, 1))
                .price(BigDecimal.valueOf(16.00))
                .stock(0)
                .category(category)
                .build());

        bookRepository.save(Book.builder()
                .title("Too Expensive")
                .author("Author Three")
                .isbn("3333333333")
                .description("Outside the price range")
                .coverUrl("https://example.com/3.jpg")
                .publishedDate(LocalDate.of(2024, 1, 1))
                .price(BigDecimal.valueOf(30.00))
                .stock(4)
                .category(category)
                .build());

        Page<Book> filtered = bookRepository.searchBooks(
                null,
                null,
                BigDecimal.valueOf(10.00),
                BigDecimal.valueOf(20.00),
                true,
                null,
                PageRequest.of(0, 10)
        );

        assertEquals(1, filtered.getTotalElements());
        assertEquals("In Stock Midrange", filtered.getContent().get(0).getTitle());
    }

    @Test
    void searchBooks_filtersByMinimumAverageRating() {
        Category category = categoryRepository.save(Category.builder()
                .name("Mystery")
                .description("Mystery books")
                .build());
        User user = userRepository.save(User.builder()
                .email("rating-user@example.com")
                .password("password")
                .fullName("Rating User")
                .role(Role.USER)
                .build());
        Book highRated = bookRepository.save(Book.builder()
                .title("High Rated")
                .author("Author One")
                .isbn("4444444444")
                .price(BigDecimal.valueOf(12.00))
                .stock(4)
                .category(category)
                .build());
        Book lowRated = bookRepository.save(Book.builder()
                .title("Low Rated")
                .author("Author Two")
                .isbn("5555555555")
                .price(BigDecimal.valueOf(12.00))
                .stock(4)
                .category(category)
                .build());
        reviewRepository.save(Review.builder().book(highRated).user(user).rating(5).comment("Great").build());
        reviewRepository.save(Review.builder().book(lowRated).user(user).rating(2).comment("Weak").build());

        Page<Book> filtered = bookRepository.searchBooks(null, null, null, null, false, 4.0, PageRequest.of(0, 10));

        assertEquals(1, filtered.getTotalElements());
        assertEquals("High Rated", filtered.getContent().get(0).getTitle());
    }
}
