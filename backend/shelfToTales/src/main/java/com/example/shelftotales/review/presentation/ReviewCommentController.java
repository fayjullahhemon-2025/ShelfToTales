package com.example.shelftotales.review.presentation;

import com.example.shelftotales.review.application.ReviewCommentRequest;
import com.example.shelftotales.review.application.ReviewCommentResponse;
import com.example.shelftotales.review.application.ReviewCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewCommentController {
    private final ReviewCommentService commentService;

    @GetMapping("/{reviewId}/comments")
    public ResponseEntity<List<ReviewCommentResponse>> getComments(@PathVariable Long reviewId) {
        return ResponseEntity.ok(commentService.getCommentsTree(reviewId));
    }

    @PostMapping("/{reviewId}/comments")
    public ResponseEntity<ReviewCommentResponse> addComment(
            @PathVariable Long reviewId,
            @RequestBody ReviewCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.addComment(reviewId, request));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        commentService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
}
