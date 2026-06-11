package com.example.shelftotales.event.observer;

import com.example.shelftotales.event.BookCompletedEvent;
import com.example.shelftotales.event.OrderConfirmedEvent;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.domain.BookEmbedding;
import com.example.shelftotales.catalog.infrastructure.BookEmbeddingRepository;
import com.example.shelftotales.bookshelf.domain.ShelfBook;
import com.example.shelftotales.bookshelf.infrastructure.ShelfBookRepository;
import com.example.shelftotales.commerce.domain.Order;
import com.example.shelftotales.commerce.domain.OrderItem;
import com.example.shelftotales.commerce.infrastructure.OrderRepository;
import com.example.shelftotales.ai.application.AIService;
import com.example.shelftotales.ai.infrastructure.UserProfileVectorRepository;
import com.example.shelftotales.ai.domain.UserProfileVector;
import com.example.shelftotales.wishlist.infrastructure.WishlistRepository;
import com.example.shelftotales.exchange.infrastructure.ExchangeListingRepository;
import com.example.shelftotales.social.infrastructure.FollowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class ProfileVectorObserverTest {

    @Mock
    private UserProfileVectorRepository profileVectorRepository;

    @Mock
    private BookEmbeddingRepository bookEmbeddingRepository;

    @Mock
    private ShelfBookRepository shelfBookRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private AIService aiService;

    @Mock
    private WishlistRepository wishlistRepository;

    @Mock
    private ExchangeListingRepository exchangeListingRepository;

    @Mock
    private FollowRepository followRepository;

    @InjectMocks
    private ProfileVectorObserver profileVectorObserver;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testMethodsAreAnnotatedWithAsync() throws NoSuchMethodException {
        Method onBookCompletedMethod = ProfileVectorObserver.class.getMethod("onBookCompleted", BookCompletedEvent.class);
        Method onOrderConfirmedMethod = ProfileVectorObserver.class.getMethod("onOrderConfirmed", OrderConfirmedEvent.class);

        assertTrue(onBookCompletedMethod.isAnnotationPresent(org.springframework.scheduling.annotation.Async.class));
        assertTrue(onOrderConfirmedMethod.isAnnotationPresent(org.springframework.scheduling.annotation.Async.class));
    }

    @Test
    public void testRecalculateUserVectorOnBookCompleted() {
        Long userId = 1L;
        BookCompletedEvent event = new BookCompletedEvent(userId, 100L, "Book Title", "http://cover.url", 5L);

        Book book1 = Book.builder().id(10L).title("Book 1").build();
        Book book2 = Book.builder().id(20L).title("Book 2").build();
        Book book3 = Book.builder().id(30L).title("Book 3").build();

        ShelfBook completedSb = ShelfBook.builder()
                .book(book1)
                .readingStatus("COMPLETED")
                .addedAt(LocalDateTime.now().minusDays(10))
                .build();
        
        ShelfBook readingSb = ShelfBook.builder()
                .book(book2)
                .readingStatus("READING")
                .addedAt(LocalDateTime.now())
                .build();

        OrderItem item = OrderItem.builder().book(book3).quantity(1).build();
        Order order = Order.builder()
                .status(com.example.shelftotales.commerce.domain.OrderStatus.CONFIRMED)
                .orderDate(LocalDateTime.now().minusDays(100))
                .items(List.of(item))
                .build();
        item.setOrder(order);

        when(shelfBookRepository.findShelfBooksByUserIdAndStatus(userId, "COMPLETED")).thenReturn(List.of(completedSb));
        when(shelfBookRepository.findShelfBooksByUserIdAndStatus(userId, "READING")).thenReturn(List.of(readingSb));
        when(orderRepository.findByUserIdOrderByOrderDateDesc(userId)).thenReturn(List.of(order));
        
        when(wishlistRepository.findByUserIdWithBook(userId)).thenReturn(Collections.emptyList());
        when(exchangeListingRepository.findByUserIdOrderByCreatedAtDesc(eq(userId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));
        when(followRepository.findFollowingIds(userId)).thenReturn(Collections.emptyList());

        BookEmbedding emb1 = BookEmbedding.builder().bookId(10L).vectorData("1,0").build();
        BookEmbedding emb2 = BookEmbedding.builder().bookId(20L).vectorData("0,1").build();
        BookEmbedding emb3 = BookEmbedding.builder().bookId(30L).vectorData("0.5,0.5").build();

        when(bookEmbeddingRepository.findAllById(anySet())).thenReturn(List.of(emb1, emb2, emb3));

        double[] v1 = new double[384]; v1[0] = 1.0;
        double[] v2 = new double[384]; v2[1] = 1.0;
        double[] v3 = new double[384]; v3[0] = 0.5; v3[1] = 0.5;

        when(aiService.stringToVector("1,0")).thenReturn(v1);
        when(aiService.stringToVector("0,1")).thenReturn(v2);
        when(aiService.stringToVector("0.5,0.5")).thenReturn(v3);
        when(aiService.vectorToString(any(double[].class))).thenReturn("recalculated_vector_data");

        User mockUser = new User();
        mockUser.setId(userId);
        when(userRepository.getReferenceById(userId)).thenReturn(mockUser);
        when(profileVectorRepository.findById(userId)).thenReturn(Optional.empty());

        profileVectorObserver.onBookCompleted(event);

        ArgumentCaptor<UserProfileVector> captor = ArgumentCaptor.forClass(UserProfileVector.class);
        verify(profileVectorRepository).save(captor.capture());

        UserProfileVector savedProfile = captor.getValue();
        assertEquals(userId, savedProfile.getUserId());
        assertEquals("recalculated_vector_data", savedProfile.getVectorData());

        ArgumentCaptor<double[]> vectorCaptor = ArgumentCaptor.forClass(double[].class);
        verify(aiService).vectorToString(vectorCaptor.capture());
        double[] resultingVector = vectorCaptor.getValue();

        // Calculate expected norm of the resulting vector to ensure it is 1.0 (normalized)
        double norm = 0;
        for (double v : resultingVector) {
            norm += v * v;
        }
        assertEquals(1.0, Math.sqrt(norm), 1e-6);

        // Verify expected weighted average vector ratios:
        // Weight 1 (completed, base 1.5, 10 days decay): 1.5 * e^(-0.0231 * 10) = 1.1906
        // Weight 2 (reading, base 1.0, 0 days decay): 1.0 * e^(0) = 1.0
        // Weight 3 (purchased, base 1.5, 100 days decay): 1.5 * max(0.2, e^(-2.31)) = 1.5 * 0.2 = 0.3
        // avgVector[0] = 1.1906 * 1.0 + 1.0 * 0.0 + 0.3 * 0.5 = 1.3406
        // avgVector[1] = 1.1906 * 0.0 + 1.0 * 1.0 + 0.3 * 0.5 = 1.15
        // totalWeight = 1.3406 / 2.4906 = 0.5383, 1.15 / 2.4906 = 0.4617
        // normalized (norm ~ 0.7091):
        // avgVector[0] = 0.759, avgVector[1] = 0.651
        assertEquals(0.759, resultingVector[0], 1e-2);
        assertEquals(0.651, resultingVector[1], 1e-2);
        assertEquals(0.0, resultingVector[2], 1e-6);
    }

    @Test
    public void testRecalculateUserVectorOnOrderConfirmed() {
        Long userId = 2L;
        OrderConfirmedEvent event = new OrderConfirmedEvent(userId, 500L, List.of(30L));

        when(shelfBookRepository.findShelfBooksByUserIdAndStatus(userId, "COMPLETED")).thenReturn(Collections.emptyList());
        when(shelfBookRepository.findShelfBooksByUserIdAndStatus(userId, "READING")).thenReturn(Collections.emptyList());
        when(orderRepository.findByUserIdOrderByOrderDateDesc(userId)).thenReturn(Collections.emptyList());
        when(wishlistRepository.findByUserIdWithBook(userId)).thenReturn(Collections.emptyList());
        when(exchangeListingRepository.findByUserIdOrderByCreatedAtDesc(eq(userId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));
        when(followRepository.findFollowingIds(userId)).thenReturn(Collections.emptyList());

        profileVectorObserver.onOrderConfirmed(event);

        verify(profileVectorRepository, never()).save(any(UserProfileVector.class));
    }
}
