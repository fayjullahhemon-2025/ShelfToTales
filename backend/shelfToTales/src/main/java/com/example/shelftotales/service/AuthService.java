package com.example.shelftotales.service;

import com.example.shelftotales.dto.AuthResponse;
import com.example.shelftotales.dto.LoginRequest;
import com.example.shelftotales.dto.RegisterRequest;
import com.example.shelftotales.model.AuthProvider;
import com.example.shelftotales.model.Role;
import com.example.shelftotales.model.User;
import com.example.shelftotales.repository.UserRepository;
import com.example.shelftotales.security.JwtService;
import com.example.shelftotales.util.PasswordValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
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
            throw new BadCredentialsException("Invalid email or password");
        }
        
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
}
