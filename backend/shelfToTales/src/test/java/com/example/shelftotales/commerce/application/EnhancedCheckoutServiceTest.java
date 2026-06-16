package com.example.shelftotales.commerce.application;

import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.infrastructure.*;
import com.example.shelftotales.commerce.application.payment.*;
import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.auth.infrastructure.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.shared.util.AuthUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class EnhancedCheckoutServiceTest {

    @Mock private CartItemRepository cartItemRepository;
    @Mock private BookRepository bookRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private ShippingAddressRepository addressRepository;
    @Mock private PaymentRecordRepository paymentRecordRepository;
    @Mock private UserRepository userRepository;
    @Mock private CouponService couponService;
    @Mock private PaymentGatewayContext paymentGatewayContext;

    @InjectMocks private EnhancedCheckoutService checkoutService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void checkout_WithEmptyCart_ShouldThrowException() {
        User user = User.builder().id(1L).email("user@example.com").build();
        try (MockedStatic<AuthUtils> authUtils = mockStatic(AuthUtils.class)) {
            authUtils.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(cartItemRepository.findByUserIdWithBook(1L)).thenReturn(Collections.emptyList());

            assertThrows(IllegalArgumentException.class, () -> {
                checkoutService.checkout(10L, "COD", null);
            });
        }
    }

    @Test
    public void checkout_WithAddressNotBelongingToUser_ShouldThrowException() {
        User user = User.builder().id(1L).email("user@example.com").build();
        User otherUser = User.builder().id(99L).email("other@example.com").build();
        ShippingAddress address = ShippingAddress.builder().id(10L).user(otherUser).build();
        Book book = Book.builder().id(2L).title("Hobbit").price(BigDecimal.valueOf(150)).stock(10).build();
        CartItem cartItem = CartItem.builder().id(3L).user(user).book(book).quantity(1).build();

        try (MockedStatic<AuthUtils> authUtils = mockStatic(AuthUtils.class)) {
            authUtils.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(cartItemRepository.findByUserIdWithBook(1L)).thenReturn(List.of(cartItem));
            when(addressRepository.findById(10L)).thenReturn(Optional.of(address));

            assertThrows(IllegalArgumentException.class, () -> {
                checkoutService.checkout(10L, "COD", null);
            });
        }
    }

    @Test
    public void checkout_WithValidCoupon_ShouldApplyDiscountAndSaveOrder() {
        User user = User.builder().id(1L).email("user@example.com").build();
        ShippingAddress address = ShippingAddress.builder().id(10L).user(user).build();
        Book book = Book.builder().id(2L).title("Hobbit").price(BigDecimal.valueOf(100)).stock(5).build();
        CartItem cartItem = CartItem.builder().id(3L).user(user).book(book).quantity(2).build();

        try (MockedStatic<AuthUtils> authUtils = mockStatic(AuthUtils.class)) {
            authUtils.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(cartItemRepository.findByUserIdWithBook(1L)).thenReturn(List.of(cartItem));
            when(addressRepository.findById(10L)).thenReturn(Optional.of(address));
            
            when(couponService.applyCoupon(eq("DISCOUNT20"), any(BigDecimal.class), any(Order.class)))
                    .thenReturn(BigDecimal.valueOf(20));

            PaymentGateway paymentGateway = mock(PaymentGateway.class);
            when(paymentGatewayContext.getGateway("BKASH")).thenReturn(paymentGateway);
            when(paymentGateway.processPayment(any(BigDecimal.class), anyString(), eq("user@example.com")))
                    .thenReturn(PaymentResult.success("TXN-123"));

            when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
                Order order = invocation.getArgument(0);
                order.setId(100L);
                return order;
            });

            OrderResponse result = checkoutService.checkout(10L, "BKASH", "DISCOUNT20");

            assertNotNull(result);
            assertEquals(100L, result.getId());
            assertEquals(OrderStatus.CONFIRMED, result.getStatus());
            assertEquals("BKASH", result.getPaymentMethod());
            assertEquals("DISCOUNT20", result.getCouponCode());
            assertEquals(BigDecimal.valueOf(20), result.getDiscountAmount());
            assertEquals(BigDecimal.valueOf(200), result.getTotalAmount());
            assertEquals(3, book.getStock());

            verify(bookRepository).save(book);
            verify(paymentRecordRepository).save(any(PaymentRecord.class));
            verify(cartItemRepository).deleteAllByUserId(1L);
        }
    }

    @Test
    public void checkout_WithSuccessfulPayment_ShouldSaveRecordsAndReturnOrder() {
        User user = User.builder().id(1L).email("user@example.com").build();
        ShippingAddress address = ShippingAddress.builder().id(10L).user(user).build();
        Book book = Book.builder().id(2L).title("Hobbit").price(BigDecimal.valueOf(150)).stock(10).build();
        CartItem cartItem = CartItem.builder().id(3L).user(user).book(book).quantity(1).build();

        try (MockedStatic<AuthUtils> authUtils = mockStatic(AuthUtils.class)) {
            authUtils.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(cartItemRepository.findByUserIdWithBook(1L)).thenReturn(List.of(cartItem));
            when(addressRepository.findById(10L)).thenReturn(Optional.of(address));

            PaymentGateway paymentGateway = mock(PaymentGateway.class);
            when(paymentGatewayContext.getGateway("COD")).thenReturn(paymentGateway);
            when(paymentGateway.processPayment(any(BigDecimal.class), anyString(), eq("user@example.com")))
                    .thenReturn(PaymentResult.success("TXN-COD"));

            when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
                Order order = invocation.getArgument(0);
                order.setId(101L);
                return order;
            });

            OrderResponse result = checkoutService.checkout(10L, "COD", null);

            assertNotNull(result);
            assertEquals(101L, result.getId());
            assertEquals(OrderStatus.CONFIRMED, result.getStatus());
            assertEquals("COD", result.getPaymentMethod());
            assertNull(result.getCouponCode());
            assertEquals(BigDecimal.ZERO, result.getDiscountAmount());
            assertEquals(BigDecimal.valueOf(150), result.getTotalAmount());
            assertEquals(9, book.getStock());

            verify(bookRepository).save(book);
            verify(paymentRecordRepository).save(any(PaymentRecord.class));
            verify(cartItemRepository).deleteAllByUserId(1L);
        }
    }

    @Test
    public void checkout_WithPaymentFailure_ShouldThrowException() {
        User user = User.builder().id(1L).email("user@example.com").build();
        ShippingAddress address = ShippingAddress.builder().id(10L).user(user).build();
        Book book = Book.builder().id(2L).title("Hobbit").price(BigDecimal.valueOf(150)).stock(10).build();
        CartItem cartItem = CartItem.builder().id(3L).user(user).book(book).quantity(1).build();

        try (MockedStatic<AuthUtils> authUtils = mockStatic(AuthUtils.class)) {
            authUtils.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(cartItemRepository.findByUserIdWithBook(1L)).thenReturn(List.of(cartItem));
            when(addressRepository.findById(10L)).thenReturn(Optional.of(address));

            PaymentGateway paymentGateway = mock(PaymentGateway.class);
            when(paymentGatewayContext.getGateway("COD")).thenReturn(paymentGateway);
            when(paymentGateway.processPayment(any(BigDecimal.class), anyString(), eq("user@example.com")))
                    .thenReturn(PaymentResult.failure("Insufficient balance"));

            assertThrows(IllegalStateException.class, () -> {
                checkoutService.checkout(10L, "COD", null);
            });

            verify(bookRepository).save(book);
            verify(paymentRecordRepository, never()).save(any(PaymentRecord.class));
            verify(orderRepository, never()).save(any(Order.class));
        }
    }
}
