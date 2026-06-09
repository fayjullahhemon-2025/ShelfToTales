package com.example.shelftotales.blog.presentation;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.blog.application.BlogPostRequest;
import com.example.shelftotales.blog.application.BlogPostResponse;
import com.example.shelftotales.blog.application.BlogPostService;
import com.example.shelftotales.shared.util.AuthUtils;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blogs")
@RequiredArgsConstructor
public class BlogPostController {
    private final BlogPostService blogPostService;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Get all published blog posts")
    public ResponseEntity<List<BlogPostResponse>> getAllPublished() {
        return ResponseEntity.ok(blogPostService.getAllPublished());
    }

    @GetMapping("/my")
    @Operation(summary = "Get current user's blog posts")
    public ResponseEntity<List<BlogPostResponse>> getMyBlogs() {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        return ResponseEntity.ok(blogPostService.getMyBlogs(currentUser.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get blog post by id and increment view count")
    public ResponseEntity<BlogPostResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(blogPostService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new blog post")
    public ResponseEntity<BlogPostResponse> create(@RequestBody BlogPostRequest request) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        return ResponseEntity.ok(blogPostService.create(request, currentUser));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a blog post")
    public ResponseEntity<BlogPostResponse> update(@PathVariable Long id, @RequestBody BlogPostRequest request) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        return ResponseEntity.ok(blogPostService.update(id, request, currentUser.getId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a blog post")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        blogPostService.delete(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/like")
    @Operation(summary = "Like a blog post")
    public ResponseEntity<BlogPostResponse> like(@PathVariable Long id) {
        return ResponseEntity.ok(blogPostService.like(id));
    }
}
