package com.example.shelftotales.commerce.application;
import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.infrastructure.*;

import com.example.shelftotales.commerce.application.payment.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.catalog.application.CategoryResponse;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.auth.infrastructure.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.bookshelf.infrastructure.*;
import com.example.shelftotales.wishlist.infrastructure.*;
import com.example.shelftotales.review.infrastructure.*;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnhancedCheckoutService {

    private final CartItemRepository cartItemRepository;
    private final BookRepository bookRepository;
    private final OrderRepository orderRepository;
    private final ShippingAddressRepository addressRepository;
    private final PaymentRecordRepository paymentRecordRepository;
    private final UserRepository userRepository;
    private final CouponService couponService;
    private final PaymentGatewayContext paymentGatewayContext;

    @Transactional
    public OrderResponse checkout(Long addressId, String paymentMethod, String couponCode) {
        User user = AuthUtils.getCurrentUser(userRepository);
        log.info("Checkout initiated: userId={}, addressId={}, paymentMethod={}", user.getId(), addressId, paymentMethod);

        List<CartItem> cartItems = cartItemRepository.findByUserIdWithBook(user.getId());
        log.info("Cart items found: userId={}, count={}", user.getId(), cartItems.size());

        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException(
                "Your cart is empty. Please add books to your cart before placing an order.");
        }

        // Validate address
        ShippingAddress address = addressRepository.findById(addressId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        if (!address.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Address does not belong to you");
        }

        // Build order
        Order order = Order.builder()
                .user(user).orderDate(LocalDateTime.now()).totalAmount(BigDecimal.ZERO).build();

        for (CartItem cartItem : cartItems) {
            Book book = cartItem.getBook();
            cartItem.validateStockAvailability();
            book.setStock(book.getStock() - cartItem.getQuantity());
            bookRepository.save(book);
            BigDecimal unitPrice = book.getPrice() != null ? book.getPrice() : BigDecimal.ZERO;
            order.addItem(book, cartItem.getQuantity(), unitPrice);
        }

        // Apply coupon
        BigDecimal discount = BigDecimal.ZERO;
        if (couponCode != null && !couponCode.isBlank()) {
            discount = couponService.applyCoupon(couponCode, order.getTotalAmount(), order);
        }

        BigDecimal finalAmount = order.getTotalAmount().subtract(discount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) finalAmount = BigDecimal.ZERO;

        // Process payment
        String method = paymentMethod != null ? paymentMethod : "COD";
        PaymentResult paymentResult = paymentGatewayContext.getGateway(method)
                .processPayment(finalAmount, "ORD-" + System.currentTimeMillis(), user.getEmail());

        if (!paymentResult.success()) {
            throw new IllegalStateException("Payment failed: " + paymentResult.message());
        }

        order.transitionTo(OrderStatus.CONFIRMED);
        order.setPaymentMethod(method);
        order.setCouponCode(couponCode);
        order.setDiscountAmount(discount);
        Order savedOrder = orderRepository.save(order);

        // Save payment record
        paymentRecordRepository.save(PaymentRecord.builder()
                .order(savedOrder).gateway(method).transactionId(paymentResult.transactionId())
                .amount(finalAmount).status("SUCCESS").build());

        // Clear cart
        cartItemRepository.deleteAllByUserId(user.getId());

        log.info("Enhanced checkout complete: orderId={}, payment={}, discount={}",
                savedOrder.getId(), method, discount);
        return mapToOrderResponse(savedOrder);
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .bookId(item.getBook().getId())
                        .bookTitle(item.getBook().getTitle())
                        .bookImageUrl(item.getBook().getCoverUrl())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .category(item.getBook().getCategory() != null ? CategoryResponse.builder()
                                .id(item.getBook().getCategory().getId())
                                .name(item.getBook().getCategory().getName())
                                .description(item.getBook().getCategory().getDescription())
                                .build() : null)
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderDate(order.getOrderDate())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .couponCode(order.getCouponCode())
                .discountAmount(order.getDiscountAmount())
                .items(itemResponses)
                .userName(order.getUser() != null ? order.getUser().getFullName() : null)
                .userEmail(order.getUser() != null ? order.getUser().getEmail() : null)
                .trackingNumber(order.getTrackingNumber())
                .build();
    }
}
