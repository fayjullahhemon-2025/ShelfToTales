package com.example.shelftotales.review.application;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.review.domain.Review;
import com.example.shelftotales.review.domain.ReviewComment;
import com.example.shelftotales.review.infrastructure.ReviewCommentRepository;
import com.example.shelftotales.review.infrastructure.ReviewRepository;
import com.example.shelftotales.shared.exception.ResourceNotFoundException;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewCommentService {
    private final ReviewCommentRepository commentRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ReviewCommentResponse> getCommentsTree(Long reviewId) {
        if (!reviewRepository.existsById(reviewId)) {
            throw new ResourceNotFoundException("Review not found");
        }
        List<ReviewComment> comments = commentRepository.findByReviewIdWithUser(reviewId);
        
        List<ReviewCommentResponse> roots = new ArrayList<>();
        Map<Long, ReviewCommentResponse> dtoMap = new HashMap<>();

        // Map all comments to DTOs first
        for (ReviewComment c : comments) {
            ReviewCommentResponse.UserSummary userSummary = ReviewCommentResponse.UserSummary.builder()
                    .id(c.getUser().getId())
                    .username(c.getUser().getUsername())
                    .profileImageUrl(c.getUser().getProfileImageUrl())
                    .build();

            ReviewCommentResponse dto = ReviewCommentResponse.builder()
                    .id(c.getId())
                    .reviewId(c.getReview().getId())
                    .parentCommentId(c.getParentComment() != null ? c.getParentComment().getId() : null)
                    .content(c.getContent())
                    .createdAt(c.getCreatedAt())
                    .user(userSummary)
                    .replies(new ArrayList<>())
                    .build();

            dtoMap.put(c.getId(), dto);
        }

        // Build tree relationships
        for (ReviewComment c : comments) {
            ReviewCommentResponse dto = dtoMap.get(c.getId());
            if (c.getParentComment() == null) {
                roots.add(dto);
            } else {
                ReviewCommentResponse parentDto = dtoMap.get(c.getParentComment().getId());
                if (parentDto != null) {
                    parentDto.getReplies().add(dto);
                } else {
                    roots.add(dto); // Orphan fallback
                }
            }
        }

        return roots;
    }

    @Transactional
    public ReviewCommentResponse addComment(Long reviewId, ReviewCommentRequest dto) {
        User user = AuthUtils.getCurrentUser(userRepository);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        ReviewComment parent = null;
        if (dto.getParentCommentId() != null) {
            parent = commentRepository.findById(dto.getParentCommentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));
        }

        ReviewComment comment = ReviewComment.builder()
                .review(review)
                .user(user)
                .parentComment(parent)
                .content(dto.getContent())
                .build();

        comment = commentRepository.save(comment);

        ReviewCommentResponse.UserSummary userSummary = ReviewCommentResponse.UserSummary.builder()
                .id(user.getId())
                .username(user.getUsername())
                .profileImageUrl(user.getProfileImageUrl())
                .build();

        return ReviewCommentResponse.builder()
                .id(comment.getId())
                .reviewId(reviewId)
                .parentCommentId(parent != null ? parent.getId() : null)
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .user(userSummary)
                .replies(new ArrayList<>())
                .build();
    }

    @Transactional
    public void deleteComment(Long commentId) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        ReviewComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUser.getRole().name());
        boolean isAuthor = comment.getUser().getId().equals(currentUser.getId());

        if (!isAuthor && !isAdmin) {
            throw new SecurityException("Not authorized to delete this comment");
        }

        commentRepository.delete(comment);
    }
}
