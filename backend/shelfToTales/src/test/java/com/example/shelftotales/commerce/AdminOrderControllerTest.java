package com.example.shelftotales.commerce;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.auth.application.*;
import com.example.shelftotales.auth.infrastructure.*;
import com.example.shelftotales.commerce.application.*;
import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.infrastructure.*;
import com.example.shelftotales.commerce.presentation.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.shared.security.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import software.amazon.awssdk.services.s3.S3Client;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class AdminOrderControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private OrderService orderService;
    @MockitoBean private S3Client s3Client;

    @BeforeEach
    void loginAsAdmin() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin@shelftotales.com",
                        null,
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    private Order sampleOrder() {
        User user = User.builder().id(1L).email("buyer@example.com").fullName("Buyer")
                .role(Role.USER).following(new java.util.HashSet<>()).followers(new java.util.HashSet<>()).build();
        Book book = Book.builder().id(1L).title("Sample").price(new BigDecimal("10.00")).build();
        OrderItem item = OrderItem.builder().id(1L).book(book).quantity(1).price(new BigDecimal("10.00")).build();
        return Order.builder()
                .id(99L)
                .user(user)
                .orderDate(LocalDateTime.now())
                .totalAmount(new BigDecimal("10.00"))
                .discountAmount(BigDecimal.ZERO)
                .status(OrderStatus.PENDING)
                .items(new java.util.ArrayList<>(List.of(item)))
                .build();
    }

    @Test
    void getAllOrders_returnsListForAdmin() throws Exception {
        Order order = sampleOrder();
        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setStatus(order.getStatus());
        response.setTotalAmount(order.getTotalAmount());
        response.setDiscountAmount(order.getDiscountAmount());
        when(orderService.getAllOrdersForAdmin()).thenReturn(List.of(response));

        mockMvc.perform(get("/api/admin/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(99))
                .andExpect(jsonPath("$[0].status").value("PENDING"));

        verify(orderService).getAllOrdersForAdmin();
    }

    @Test
    void getAllOrders_returnsEmptyArrayWhenNoOrders() throws Exception {
        when(orderService.getAllOrdersForAdmin()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void updateStatus_updatesExistingOrder() throws Exception {
        OrderResponse updated = new OrderResponse();
        updated.setId(99L);
        updated.setStatus(OrderStatus.CONFIRMED);
        when(orderService.adminUpdateStatus(eq(99L), eq("CONFIRMED"), isNull())).thenReturn(updated);

        mockMvc.perform(put("/api/admin/orders/99/status")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of("status", "CONFIRMED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(99))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        verify(orderService).adminUpdateStatus(99L, "CONFIRMED", null);
    }

    @Test
    void updateStatus_propagatesServiceErrors() throws Exception {
        when(orderService.adminUpdateStatus(eq(404L), eq("CONFIRMED"), isNull()))
                .thenThrow(new IllegalArgumentException("Order not found: 404"));

        mockMvc.perform(put("/api/admin/orders/404/status")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of("status", "CONFIRMED"))))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void updateStatus_rejectsInvalidStatusValue() throws Exception {
        when(orderService.adminUpdateStatus(eq(99L), eq("FROBNICATE"), isNull()))
                .thenThrow(new IllegalArgumentException("Invalid order status: FROBNICATE"));

        mockMvc.perform(put("/api/admin/orders/99/status")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of("status", "FROBNICATE"))))
                .andExpect(status().is4xxClientError());
    }
}
