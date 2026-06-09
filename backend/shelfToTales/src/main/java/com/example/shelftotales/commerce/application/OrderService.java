package com.example.shelftotales.commerce.application;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.catalog.application.CategoryResponse;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.commerce.domain.CartItem;
import com.example.shelftotales.commerce.domain.Order;
import com.example.shelftotales.commerce.domain.OrderStatus;
import com.example.shelftotales.commerce.infrastructure.CartItemRepository;
import com.example.shelftotales.commerce.infrastructure.OrderRepository;
import com.example.shelftotales.notification.Notification;
import com.example.shelftotales.notification.NotificationFactory;
import com.example.shelftotales.notification.NotificationType;
import com.example.shelftotales.shared.util.AuthUtils;
import io.github.resilience4j.retry.annotation.Retry;
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
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final NotificationFactory notificationFactory;

    @Transactional
    @Retry(name = "orderCheckout")
    public OrderResponse checkout() {
        User user = AuthUtils.getCurrentUser(userRepository);
        List<CartItem> cartItems = cartItemRepository.findByUserIdWithBook(user.getId());

        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        log.info("Checkout started: userId={}, items={}", user.getId(), cartItems.size());

        Order order = Order.builder()
                .user(user)
                .orderDate(LocalDateTime.now())
                .totalAmount(BigDecimal.ZERO)
                .build();

        for (CartItem cartItem : cartItems) {
            Book book = cartItem.getBook();
            cartItem.validateStockAvailability();

            // Deduct stock
            book.setStock(book.getStock() - cartItem.getQuantity());
            bookRepository.save(book);

            BigDecimal unitPrice = book.getPrice() != null ? book.getPrice() : BigDecimal.ZERO;
            order.addItem(book, cartItem.getQuantity(), unitPrice);
        }

        order.transitionTo(OrderStatus.CONFIRMED);
        Order savedOrder = orderRepository.save(order);

        // Clear Cart
        cartItemRepository.deleteAllByUserId(user.getId());

        // Notify user via Factory pattern
        notificationFactory.send(NotificationType.EMAIL, Notification.builder()
                .recipient(user.getEmail())
                .subject("Order Confirmed #" + savedOrder.getId())
                .message("Your order of " + savedOrder.getItems().size() + " items has been confirmed.")
                .build());

        log.info("Checkout complete: orderId={}, total={}", savedOrder.getId(), savedOrder.getTotalAmount());
        return mapToOrderResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getHistory() {
        User user = AuthUtils.getCurrentUser(userRepository);
        List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(user.getId());
        return orders.stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId) {
        User user = AuthUtils.getCurrentUser(userRepository);
        Order order = orderRepository.findByIdAndUserIdWithItems(orderId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        return mapToOrderResponse(order);
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
                .items(itemResponses)
                .build();
    }
}
