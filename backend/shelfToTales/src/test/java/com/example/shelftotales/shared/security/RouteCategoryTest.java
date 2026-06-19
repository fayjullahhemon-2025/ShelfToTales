package com.example.shelftotales.shared.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RouteCategoryTest {

    @Test
    void fromUri_authPath_returnsAuth() {
        assertEquals(RouteCategory.AUTH, RouteCategory.fromUri("/api/auth/login"));
    }

    @Test
    void fromUri_searchPath_returnsSearch() {
        assertEquals(RouteCategory.SEARCH, RouteCategory.fromUri("/api/search?q=x"));
        assertEquals(RouteCategory.SEARCH, RouteCategory.fromUri("/api/search/image"));
        assertEquals(RouteCategory.SEARCH, RouteCategory.fromUri("/api/search/semantic"));
    }

    @Test
    void fromUri_unknownPath_returnsOther() {
        assertEquals(RouteCategory.OTHER, RouteCategory.fromUri("/api/whatever"));
    }
}
