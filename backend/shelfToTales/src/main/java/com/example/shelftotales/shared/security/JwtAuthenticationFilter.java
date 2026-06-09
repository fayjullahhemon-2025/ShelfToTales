package com.example.shelftotales.shared.security;

import com.example.shelftotales.admin.application.SecurityMonitoringService;
import com.example.shelftotales.admin.domain.SecurityEventSeverity;
import com.example.shelftotales.admin.domain.SecurityEventType;
import com.example.shelftotales.shared.util.TokenBlacklist;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final TokenBlacklist tokenBlacklist;
    private final SecurityMonitoringService securityMonitoringService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        
        if (tokenBlacklist.isBlacklisted(jwt)) {
            logger.debug("Token is blacklisted");
            recordSecurityEvent(SecurityEventType.BLACKLISTED_TOKEN_USED, SecurityEventSeverity.HIGH, request, null, "Blacklisted JWT used");
            filterChain.doFilter(request, response);
            return;
        }
        
        userEmail = jwtService.extractUsername(jwt);

        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (Exception e) {
                // Log the error but continue the filter chain
                logger.debug("JWT authentication failed: " + e.getMessage());
                recordSecurityEvent(SecurityEventType.JWT_AUTHENTICATION_FAILED, SecurityEventSeverity.MEDIUM, request, userEmail, e.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }

    private void recordSecurityEvent(SecurityEventType type, SecurityEventSeverity severity, HttpServletRequest request, String principal, String message) {
        try {
            securityMonitoringService.record(type, severity, request, principal, message);
        } catch (RuntimeException ignored) {
            // Monitoring must never block authentication flow.
        }
    }
}
