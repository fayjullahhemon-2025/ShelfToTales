package com.example.shelftotales.service;

import com.example.shelftotales.dto.BookResponse;
import com.example.shelftotales.dto.PagedResponse;
import com.example.shelftotales.model.Book;
import com.example.shelftotales.model.Category;
import com.example.shelftotales.repository.BookRepository;
import com.example.shelftotales.repository.CategoryRepository;
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

        when(bookRepository.searchBooks(any(), any(), any(Pageable.class))).thenReturn(bookPage);

        PagedResponse<BookResponse> response = bookService.getBooks(null, null, 0, 20, "title", "asc");

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

        when(bookRepository.searchBooks(any(), any(), any(Pageable.class))).thenReturn(bookPage);

        PagedResponse<BookResponse> response = bookService.getBooks("Test", null, 0, 20, "title", "asc");

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        verify(bookRepository).searchBooks(any(), any(), any(Pageable.class));
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

        var request = new com.example.shelftotales.dto.BookRequest();
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
