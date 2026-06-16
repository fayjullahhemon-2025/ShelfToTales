package com.example.shelftotales.commerce.application;

import com.example.shelftotales.auth.domain.Role;
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
import com.example.shelftotales.event.OrderConfirmedEvent;
import com.example.shelftotales.shared.util.AuthUtils;
import com.example.shelftotales.social.application.NotificationService;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.context.ApplicationEventPublisher;
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
    private final ApplicationEventPublisher eventPublisher;
    private final NotificationService notificationService;

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

        // Publish event for AI profiling
        List<Long> bookIds = savedOrder.getItems().stream()
                .map(item -> item.getBook().getId())
                .collect(Collectors.toList());
        eventPublisher.publishEvent(new OrderConfirmedEvent(user.getId(), savedOrder.getId(), bookIds));

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

    @Transactional
    public OrderResponse markAsReceived(Long orderId) {
        User user = AuthUtils.getCurrentUser(userRepository);
        Order order = orderRepository.findByIdAndUserIdWithItems(orderId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        
        order.transitionTo(OrderStatus.DELIVERED);
        Order savedOrder = orderRepository.save(order);

        String bookNames = savedOrder.getItems().stream()
                .map(item -> item.getBook().getTitle())
                .collect(Collectors.joining(", "));
        String message = user.getFullName() + " marked order #" + savedOrder.getId() + " as received. Books: " + bookNames;

        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            notificationService.create(admin.getId(), user.getId(), "ORDER_RECEIVED", "ORDER", savedOrder.getId(), message);
        }

        log.info("Order marked as received: orderId={}, userId={}, notified {} admin(s)", savedOrder.getId(), user.getId(), admins.size());
        return mapToOrderResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrdersForAdmin() {
        List<Order> orders = orderRepository.findAll();
        return orders.stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse adminUpdateStatus(Long orderId, String statusStr, String trackingNumber) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        if (statusStr == null || statusStr.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }
        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid order status: " + statusStr +
                    ". Valid values: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED");
        }
        order.transitionTo(newStatus);
        if (trackingNumber != null && !trackingNumber.isBlank()) {
            order.setTrackingNumber(trackingNumber);
        }
        Order saved = orderRepository.save(order);
        return mapToOrderResponse(saved);
    }

    public OrderResponse mapToOrderResponse(Order order) {
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
