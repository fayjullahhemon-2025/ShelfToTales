package com.example.shelftotales.admin.presentation;
import com.example.shelftotales.admin.domain.*;
import com.example.shelftotales.admin.application.*;

import com.example.shelftotales.auth.domain.Role;
import com.example.shelftotales.auth.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<Page<User>> getAllUsers(Pageable pageable) {
        return ResponseEntity.ok(adminUserService.getAllUsers(pageable));
    }

    @PostMapping("/{userId}/ban")
    public ResponseEntity<Void> ban(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        adminUserService.banUser(userId, body.get("reason"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{userId}/unban")
    public ResponseEntity<Void> unban(@PathVariable Long userId) {
        adminUserService.unbanUser(userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{userId}/warn")
    public ResponseEntity<Void> warn(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        adminUserService.warnUser(userId, body.get("reason"));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userId}/warnings")
    public ResponseEntity<List<UserWarning>> getWarnings(@PathVariable Long userId) {
        return ResponseEntity.ok(adminUserService.getWarnings(userId));
    }

    @PutMapping("/{userId}/role")
    public ResponseEntity<Void> changeRole(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        adminUserService.changeRole(userId, Role.valueOf(body.get("role")));
        return ResponseEntity.ok().build();
    }
}
