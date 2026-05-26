package com.example.shelftotales.auth.application;

import com.example.shelftotales.auth.application.AuthResponse;
import com.example.shelftotales.auth.application.LoginRequest;
import com.example.shelftotales.auth.application.RegisterRequest;
import com.example.shelftotales.auth.domain.AuthProvider;
import com.example.shelftotales.auth.domain.Role;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.security.JwtService;
import com.example.shelftotales.shared.util.PasswordValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        try {
            if (repository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email already registered");
            }

            PasswordValidator.validate(request.getPassword());

            log.info("User registered: email={}", maskEmail(request.getEmail()));

            var user = User.builder()
                    .fullName(request.getFullName())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(Role.USER)
                    .authProvider(AuthProvider.LOCAL)
                    .build();
            repository.save(user);
            var jwtToken = jwtService.generateToken(user);
            return AuthResponse.builder()
                    .id(user.getId())
                    .token(jwtToken)
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role(user.getRole())
                    .build();
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Email already registered");
        }
    }

    public AuthResponse login(LoginRequest request) {
        User user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (user.getAuthProvider() != AuthProvider.LOCAL) {
            throw new BadCredentialsException("Invalid email or password");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt: email={}", maskEmail(request.getEmail()));
            throw new BadCredentialsException("Invalid email or password");
        }

        log.info("User logged in: userId={}", user.getId());
        
        var jwtToken = jwtService.generateToken(user);
        return AuthResponse.builder()
                .id(user.getId())
                .token(jwtToken)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .profileImageUrl(user.getProfileImageUrl())
                .role(user.getRole())
                .build();
    }

    private static String maskEmail(String email) {
        if (email == null) return "null";
        int at = email.indexOf('@');
        if (at <= 1) return "***@" + (at >= 0 ? email.substring(at + 1) : "***");
        return email.charAt(0) + "***" + email.substring(at);
    }
}
