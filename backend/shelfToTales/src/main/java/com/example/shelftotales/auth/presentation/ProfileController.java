package com.example.shelftotales.auth.presentation;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.shared.dto.*;
import com.example.shelftotales.auth.application.*;
import com.example.shelftotales.catalog.application.*;
import com.example.shelftotales.bookshelf.application.*;
import com.example.shelftotales.commerce.application.*;
import com.example.shelftotales.social.application.*;
import com.example.shelftotales.readingroom.application.*;
import com.example.shelftotales.auth.application.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Tag(name = "Profile", description = "Authenticated user profile management")
public class ProfileController {
    private final ProfileService profileService;

    @GetMapping
    @Operation(summary = "Get current user's profile")
    public ResponseEntity<ProfileResponse> getProfile() {
        return ResponseEntity.ok(profileService.getProfile());
    }

    @PutMapping
    @Operation(summary = "Update profile fields (fullName, bio, profileImageUrl)")
    public ResponseEntity<ProfileResponse> updateProfile(@Valid @RequestBody ProfileRequest request) {
        return ResponseEntity.ok(profileService.updateProfile(request));
    }
}
