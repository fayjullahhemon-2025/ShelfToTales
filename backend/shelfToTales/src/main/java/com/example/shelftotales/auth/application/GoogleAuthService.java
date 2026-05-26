package com.example.shelftotales.auth.application;

import com.example.shelftotales.auth.application.AuthResponse;
import com.example.shelftotales.auth.domain.AuthProvider;
import com.example.shelftotales.auth.domain.Role;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.security.JwtService;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthService {

    private static final String GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RestTemplate restTemplate;

    @Transactional
    public AuthResponse authenticateWithGoogle(String idToken) {
        Map<String, Object> payload = verifyGoogleToken(idToken);

        String googleId = (String) payload.get("sub");
        String email = (String) payload.get("email");
        String name = (String) payload.get("name");
        String pictureUrl = (String) payload.get("picture");
        String audience = (String) payload.get("aud");

        if (!"908376284076-qp26p58bj59uatj3am37l9dk6sqm5bcb.apps.googleusercontent.com".equals(audience)) {
            throw new IllegalArgumentException("Google token not issued for this application");
        }

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Google account has no email");
        }

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = User.builder()
                    .email(email)
                    .fullName(name)
                    .password(null)
                    .role(Role.USER)
                    .authProvider(AuthProvider.GOOGLE)
                    .googleId(googleId)
                    .profileImageUrl(pictureUrl)
                    .build();
        } else {
            if (user.getAuthProvider() == AuthProvider.LOCAL) {
                throw new IllegalArgumentException("Email already registered with password login");
            }
            user.setGoogleId(googleId);
            user.setAuthProvider(AuthProvider.GOOGLE);

            // Only sync name from Google if user has never customized it
            if (!Boolean.TRUE.equals(user.getNameOverridden())) {
                user.setFullName(name);
            }

            // Only sync avatar if user has not set a custom one
            if (pictureUrl != null && (user.getProfileImageUrl() == null
                    || user.getProfileImageUrl().contains("googleusercontent.com"))) {
                user.setProfileImageUrl(pictureUrl);
            }
        }

        userRepository.save(user);

        String jwt = jwtService.generateToken(user);
        return AuthResponse.builder()
                .id(user.getId())
                .token(jwt)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .profileImageUrl(user.getProfileImageUrl())
                .role(user.getRole())
                .build();
    }

    @SuppressWarnings("unchecked")
    @CircuitBreaker(name = "google", fallbackMethod = "googleTokenFallback")
    @Retry(name = "google")
    public Map<String, Object> verifyGoogleToken(String idToken) {
        try {
            String url = GOOGLE_TOKEN_INFO_URL + idToken;
            return restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            log.error("Google token verification failed: {}", e.getMessage());
            throw new IllegalArgumentException("Invalid Google ID token");
        }
    }

    // Fallback when circuit breaker is open
    @SuppressWarnings("unchecked")
    private Map<String, Object> googleTokenFallback(String idToken, Exception ex) {
        log.warn("Google auth service unavailable, circuit breaker open: {}", ex.getMessage());
        throw new IllegalArgumentException("Google authentication service temporarily unavailable. Please try again later.");
    }
}
