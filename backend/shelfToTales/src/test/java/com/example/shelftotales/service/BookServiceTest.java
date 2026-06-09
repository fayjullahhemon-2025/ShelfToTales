package com.example.shelftotales.service;
import com.example.shelftotales.review.domain.*;
import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.auth.application.*;
import com.example.shelftotales.auth.infrastructure.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.catalog.application.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.bookshelf.application.*;
import com.example.shelftotales.bookshelf.infrastructure.*;
import com.example.shelftotales.bookshelf.presentation.*;
import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.application.*;
import com.example.shelftotales.commerce.infrastructure.*;
import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.social.application.*;
import com.example.shelftotales.social.infrastructure.*;
import com.example.shelftotales.gamification.domain.*;
import com.example.shelftotales.gamification.application.*;
import com.example.shelftotales.gamification.infrastructure.*;
import com.example.shelftotales.exchange.domain.*;
import com.example.shelftotales.exchange.application.*;
import com.example.shelftotales.exchange.infrastructure.*;
import com.example.shelftotales.ai.application.*;
import com.example.shelftotales.readingroom.domain.*;
import com.example.shelftotales.readingroom.application.*;
import com.example.shelftotales.readingroom.infrastructure.*;
import com.example.shelftotales.review.application.*;
import com.example.shelftotales.review.infrastructure.*;
import com.example.shelftotales.wishlist.application.*;
import com.example.shelftotales.wishlist.infrastructure.*;
import com.example.shelftotales.shared.security.*;
import com.example.shelftotales.shared.util.*;
import com.example.shelftotales.auth.presentation.*;
import com.example.shelftotales.shared.dto.*;

import com.example.shelftotales.ai.application.AIService;

import com.example.shelftotales.catalog.application.BookResponse;
import com.example.shelftotales.shared.dto.PagedResponse;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.domain.Category;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.catalog.infrastructure.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

    @Mock
    private BookRepository bookRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private com.example.shelftotales.catalog.infrastructure.BookEmbeddingRepository bookEmbeddingRepository;

    @Mock
    private AIService aiService;

    @Mock
    private EmbeddingService embeddingService;

    @InjectMocks
    private BookService bookService;

    private Book testBook;
    private Category testCategory;

    @BeforeEach
    void setUp() {
        testCategory = Category.builder()
                .id(1L)
                .name("Fiction")
                .build();

        testBook = Book.builder()
                .id(1L)
                .title("Test Book")
                .author("Test Author")
                .isbn("123456789")
                .description("Test Description")
                .price(BigDecimal.valueOf(19.99))
                .category(testCategory)
                .build();
    }

    @Test
    void testGetBooksWithPagination() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Book> bookPage = new PageImpl<>(List.of(testBook), pageable, 1);

        when(bookRepository.searchBooks(any(), any(), any(), any(), anyBoolean(), any(), any(Pageable.class))).thenReturn(bookPage);

        PagedResponse<BookResponse> response = bookService.getBooks(null, null, null, null, false, null, 0, 20, "title", "asc");

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals(0, response.getPage());
        assertEquals(20, response.getSize());
        assertEquals(1, response.getTotalElements());
    }

    @Test
    void testGetBooksWithSearch() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Book> bookPage = new PageImpl<>(List.of(testBook), pageable, 1);

        when(bookRepository.searchBooks(any(), any(), any(), any(), anyBoolean(), any(), any(Pageable.class))).thenReturn(bookPage);

        PagedResponse<BookResponse> response = bookService.getBooks("Test", null, null, null, false, null, 0, 20, "title", "asc");

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        verify(bookRepository).searchBooks(any(), any(), any(), any(), anyBoolean(), any(), any(Pageable.class));
    }

    @Test
    void testGetBookById() {
        when(bookRepository.findById(1L)).thenReturn(Optional.of(testBook));

        Optional<BookResponse> response = bookService.getBookById(1L);

        assertTrue(response.isPresent());
        assertEquals("Test Book", response.get().getTitle());
    }

    @Test
    void testGetBookByIdNotFound() {
        when(bookRepository.findById(999L)).thenReturn(Optional.empty());

        Optional<BookResponse> response = bookService.getBookById(999L);

        assertFalse(response.isPresent());
    }

    @Test
    void testCreateBook() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));
        when(bookRepository.save(any(Book.class))).thenReturn(testBook);

        var request = new com.example.shelftotales.catalog.application.BookRequest();
        request.setTitle("Test Book");
        request.setAuthor("Test Author");
        request.setIsbn("123456789");
        request.setDescription("Test Description");
        request.setPrice(BigDecimal.valueOf(19.99));
        request.setCategoryId(1L);

        BookResponse response = bookService.createBook(request);

        assertNotNull(response);
        assertEquals("Test Book", response.getTitle());
        verify(bookRepository).save(any(Book.class));
    }

    @Test
    void testDeleteBook() {
        when(bookRepository.existsById(1L)).thenReturn(true);

        bookService.deleteBook(1L);

        verify(bookRepository).deleteById(1L);
    }

    @Test
    void testDeleteBookNotFound() {
        when(bookRepository.existsById(999L)).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> bookService.deleteBook(999L));
    }
}
