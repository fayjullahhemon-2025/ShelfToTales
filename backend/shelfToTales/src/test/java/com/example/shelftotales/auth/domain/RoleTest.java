package com.example.shelftotales.auth.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class RoleTest {

    @Test
    void includesModeratorRole() {
        assertNotNull(Role.valueOf("MODERATOR"));
    }
}
