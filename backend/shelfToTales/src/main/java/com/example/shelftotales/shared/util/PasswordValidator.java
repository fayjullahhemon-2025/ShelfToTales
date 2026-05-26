package com.example.shelftotales.shared.util;

import java.util.Set;

public class PasswordValidator {
    private static final int MIN_LENGTH = 8;
    private static final String UPPERCASE_PATTERN = ".*[A-Z].*";
    private static final String LOWERCASE_PATTERN = ".*[a-z].*";
    private static final String DIGIT_PATTERN = ".*\\d.*";
    private static final String SPECIAL_PATTERN = ".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*";

    /**
     * Common weak passwords that meet structural rules but are well-known.
     * Compared case-insensitively.
     */
    private static final Set<String> COMMON_PASSWORDS = Set.of(
            "password", "password1", "password123", "passw0rd",
            "admin", "admin123", "administrator",
            "qwerty", "qwerty123", "qwertyuiop",
            "12345678", "123456789", "1234567890",
            "letmein", "welcome", "welcome1",
            "monkey", "dragon", "iloveyou",
            "abc123", "abc12345", "p@ssw0rd", "p@ssword"
    );

    public static void validate(String password) {
        if (password == null || password.length() < MIN_LENGTH) {
            throw new IllegalArgumentException("Password must be at least " + MIN_LENGTH + " characters long");
        }
        if (password.length() > 128) {
            throw new IllegalArgumentException("Password must not exceed 128 characters");
        }
        if (!password.matches(UPPERCASE_PATTERN)) {
            throw new IllegalArgumentException("Password must contain at least one uppercase letter");
        }
        if (!password.matches(LOWERCASE_PATTERN)) {
            throw new IllegalArgumentException("Password must contain at least one lowercase letter");
        }
        if (!password.matches(DIGIT_PATTERN)) {
            throw new IllegalArgumentException("Password must contain at least one digit");
        }
        if (!password.matches(SPECIAL_PATTERN)) {
            throw new IllegalArgumentException("Password must contain at least one special character");
        }
        if (COMMON_PASSWORDS.contains(password.toLowerCase())) {
            throw new IllegalArgumentException("Password is too common, please choose a stronger password");
        }
    }
}
