package com.example.shelftotales.security;
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RateLimitingFilterTest {

    private RateLimitingFilter filter;
    private FilterChain chain;

    @BeforeEach
    void setUp() {
        filter = new RateLimitingFilter(new ObjectMapper().registerModule(new JavaTimeModule()));
        chain = mock(FilterChain.class);
    }

    @Test
    void nonAuthEndpoint_passesThroughWithoutLimit() throws ServletException, IOException {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/books");
        req.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse res = new MockHttpServletResponse();

        // Loop way past the limit; non-auth endpoints must always pass through.
        for (int i = 0; i < 50; i++) {
            filter.doFilter(req, res, chain);
        }

        verify(chain, times(50)).doFilter(req, res);
        assertEquals(200, res.getStatus());
    }

    @Test
    void authEndpoint_allows10ThenBlocks() throws ServletException, IOException {
        String ip = "10.0.0.2";

        // First 10 requests pass.
        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
            req.setRemoteAddr(ip);
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, chain);
            assertEquals(200, res.getStatus(), "request " + i + " should not be limited");
        }

        // 11th is blocked with 429.
        MockHttpServletRequest blocked = new MockHttpServletRequest("POST", "/api/auth/login");
        blocked.setRemoteAddr(ip);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        filter.doFilter(blocked, blockedRes, chain);

        assertEquals(429, blockedRes.getStatus());
        assertNotNull(blockedRes.getHeader("Retry-After"));
        assertTrue(blockedRes.getContentAsString().contains("Rate limit"));
    }

    @Test
    void differentIPs_haveSeparateBuckets() throws ServletException, IOException {
        // IP A consumes its 10-request budget.
        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest reqA = new MockHttpServletRequest("POST", "/api/auth/login");
            reqA.setRemoteAddr("10.0.0.10");
            filter.doFilter(reqA, new MockHttpServletResponse(), chain);
        }

        // IP B should still be allowed because it has its own bucket.
        MockHttpServletRequest reqB = new MockHttpServletRequest("POST", "/api/auth/login");
        reqB.setRemoteAddr("10.0.0.11");
        MockHttpServletResponse resB = new MockHttpServletResponse();
        filter.doFilter(reqB, resB, chain);

        assertEquals(200, resB.getStatus());
    }

    @Test
    void xForwardedFor_isIgnored_usesRemoteAddr() throws ServletException, IOException {
        // X-Forwarded-For is no longer trusted (prevents IP spoofing bypass).
        // Two requests with same X-Forwarded-For but different remoteAddr
        // must get SEPARATE buckets (keyed by remoteAddr).
        MockHttpServletRequest first = new MockHttpServletRequest("POST", "/api/auth/login");
        first.setRemoteAddr("10.0.0.20");
        first.addHeader("X-Forwarded-For", "203.0.113.5, 10.0.0.20");

        // Use up the budget for remoteAddr 10.0.0.20
        for (int i = 0; i < 10; i++) {
            filter.doFilter(first, new MockHttpServletResponse(), chain);
        }

        // Different remoteAddr should NOT be blocked (separate bucket)
        MockHttpServletRequest second = new MockHttpServletRequest("POST", "/api/auth/login");
        second.setRemoteAddr("10.0.0.21");
        second.addHeader("X-Forwarded-For", "203.0.113.5, 10.0.0.21");

        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(second, res, chain);

        assertEquals(200, res.getStatus());
    }

    @Test
    void checkoutEndpoint_allows10ThenBlocks() throws ServletException, IOException {
        String ip = "10.0.0.3";

        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/checkout");
            req.setRemoteAddr(ip);
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, chain);
            assertEquals(200, res.getStatus());
        }

        MockHttpServletRequest blocked = new MockHttpServletRequest("POST", "/api/checkout");
        blocked.setRemoteAddr(ip);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        filter.doFilter(blocked, blockedRes, chain);

        assertEquals(429, blockedRes.getStatus());
    }

    @Test
    void ordersEndpoint_allows10ThenBlocks() throws ServletException, IOException {
        String ip = "10.0.0.4";

        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/orders");
            req.setRemoteAddr(ip);
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, chain);
            assertEquals(200, res.getStatus());
        }

        MockHttpServletRequest blocked = new MockHttpServletRequest("GET", "/api/orders");
        blocked.setRemoteAddr(ip);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        filter.doFilter(blocked, blockedRes, chain);

        assertEquals(429, blockedRes.getStatus());
    }

    @Test
    void exchangeEndpoint_allows10ThenBlocks() throws ServletException, IOException {
        String ip = "10.0.0.5";

        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/exchange/listings");
            req.setRemoteAddr(ip);
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, chain);
            assertEquals(200, res.getStatus());
        }

        MockHttpServletRequest blocked = new MockHttpServletRequest("GET", "/api/exchange/listings");
        blocked.setRemoteAddr(ip);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        filter.doFilter(blocked, blockedRes, chain);

        assertEquals(429, blockedRes.getStatus());
    }

    @Test
    void routeSegmentation_avoidsCrossEndpointRateLimitExhaustion() throws ServletException, IOException {
        String ip = "10.0.0.6";

        // Exhaust rate limit for auth
        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest authReq = new MockHttpServletRequest("POST", "/api/auth/login");
            authReq.setRemoteAddr(ip);
            filter.doFilter(authReq, new MockHttpServletResponse(), chain);
        }

        // Verify auth is now blocked
        MockHttpServletRequest authBlocked = new MockHttpServletRequest("POST", "/api/auth/login");
        authBlocked.setRemoteAddr(ip);
        MockHttpServletResponse authRes = new MockHttpServletResponse();
        filter.doFilter(authBlocked, authRes, chain);
        assertEquals(429, authRes.getStatus());

        // Verify checkout, orders, exchange, and other endpoints from the same IP are NOT blocked
        MockHttpServletRequest checkoutReq = new MockHttpServletRequest("POST", "/api/checkout");
        checkoutReq.setRemoteAddr(ip);
        MockHttpServletResponse checkoutRes = new MockHttpServletResponse();
        filter.doFilter(checkoutReq, checkoutRes, chain);
        assertEquals(200, checkoutRes.getStatus());

        MockHttpServletRequest ordersReq = new MockHttpServletRequest("GET", "/api/orders");
        ordersReq.setRemoteAddr(ip);
        MockHttpServletResponse ordersRes = new MockHttpServletResponse();
        filter.doFilter(ordersReq, ordersRes, chain);
        assertEquals(200, ordersRes.getStatus());

        MockHttpServletRequest exchangeReq = new MockHttpServletRequest("GET", "/api/exchange/listings");
        exchangeReq.setRemoteAddr(ip);
        MockHttpServletResponse exchangeRes = new MockHttpServletResponse();
        filter.doFilter(exchangeReq, exchangeRes, chain);
        assertEquals(200, exchangeRes.getStatus());
    }
}
