package com.example.shelftotales.service;

import com.example.shelftotales.dto.AuthResponse;
import com.example.shelftotales.dto.LoginRequest;
import com.example.shelftotales.dto.RegisterRequest;
import com.example.shelftotales.model.AuthProvider;
import com.example.shelftotales.model.Role;
import com.example.shelftotales.model.User;
import com.example.shelftotales.repository.UserRepository;
import com.example.shelftotales.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
                .fullName("Test User")
                .email("test@example.com")
                .password("TestPass123!")
                .build();

        loginRequest = LoginRequest.builder()
                .email("test@example.com")
                .password("TestPass123!")
                .build();

        testUser = User.builder()
                .id(1L)
                .fullName("Test User")
                .email("test@example.com")
                .password("encodedPassword")
                .role(Role.USER)
                .authProvider(AuthProvider.LOCAL)
                .build();
    }

    @Test
    void testRegisterSuccess() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt-token");

        AuthResponse response = authService.register(registerRequest);

        assertNotNull(response);
        assertEquals("test@example.com", response.getEmail());
        assertEquals("jwt-token", response.getToken());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testRegisterWeakPassword() {
        RegisterRequest weakRequest = RegisterRequest.builder()
                .fullName("Test User")
                .email("test@example.com")
                .password("weak")
                .build();

        assertThrows(IllegalArgumentException.class, () -> authService.register(weakRequest));
    }

    @Test
    void testRegisterDuplicateEmail() {
        when(userRepository.existsByEmail(any())).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> authService.register(registerRequest));
    }

    @Test
    void testRegisterRaceCondition() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenThrow(new DataIntegrityViolationException("Duplicate key"));

        assertThrows(IllegalArgumentException.class, () -> authService.register(registerRequest));
    }

    @Test
    void testLoginSuccess() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(testUser));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("test@example.com", "password123"));
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt-token");

        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("test@example.com", response.getEmail());
        assertEquals("jwt-token", response.getToken());
    }

    @Test
    void testLoginUserNotFound() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class, () -> authService.login(loginRequest));
    }

    @Test
    void testLoginOAuthUser() {
        User oauthUser = User.builder()
                .id(2L)
                .email("oauth@example.com")
                .authProvider(AuthProvider.GOOGLE)
                .build();

        when(userRepository.findByEmail(any())).thenReturn(Optional.of(oauthUser));

        LoginRequest oauthLogin = LoginRequest.builder()
                .email("oauth@example.com")
                .password("password123")
                .build();

        assertThrows(BadCredentialsException.class, () -> authService.login(oauthLogin));
    }
}
