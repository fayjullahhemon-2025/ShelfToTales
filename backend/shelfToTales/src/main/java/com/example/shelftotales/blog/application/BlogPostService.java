package com.example.shelftotales.blog.application;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.blog.domain.BlogPost;
import com.example.shelftotales.blog.infrastructure.BlogPostRepository;
import com.example.shelftotales.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlogPostService {
    private final BlogPostRepository blogPostRepository;

    @Transactional(readOnly = true)
    public List<BlogPostResponse> getAllPublished() {
        return blogPostRepository.findByStatus("PUBLISHED").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BlogPostResponse> getMyBlogs(Long authorId) {
        return blogPostRepository.findByAuthorId(authorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BlogPostResponse getById(Long id) {
        BlogPost post = blogPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blog post not found: " + id));
        post.setViewsCount(post.getViewsCount() + 1);
        return mapToResponse(blogPostRepository.save(post));
    }

    @Transactional
    public BlogPostResponse create(BlogPostRequest request, User author) {
        BlogPost post = BlogPost.builder()
                .author(author)
                .title(request.getTitle())
                .content(request.getContent())
                .status(request.getStatus() != null ? request.getStatus() : "PUBLISHED")
                .build();
        return mapToResponse(blogPostRepository.save(post));
    }

    @Transactional
    public BlogPostResponse update(Long id, BlogPostRequest request, Long userId) {
        BlogPost post = blogPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blog post not found: " + id));
        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("You are not the author of this post");
        }
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        if (request.getStatus() != null) {
            post.setStatus(request.getStatus());
        }
        return mapToResponse(blogPostRepository.save(post));
    }

    @Transactional
    public void delete(Long id, Long userId) {
        BlogPost post = blogPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blog post not found: " + id));
        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("You are not the author of this post");
        }
        blogPostRepository.delete(post);
    }

    @Transactional
    public BlogPostResponse like(Long id) {
        BlogPost post = blogPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blog post not found: " + id));
        post.setLikesCount(post.getLikesCount() + 1);
        return mapToResponse(blogPostRepository.save(post));
    }

    private BlogPostResponse mapToResponse(BlogPost post) {
        return BlogPostResponse.builder()
                .id(post.getId())
                .authorId(post.getAuthor().getId())
                .authorName(post.getAuthor().getFullName())
                .title(post.getTitle())
                .content(post.getContent())
                .status(post.getStatus())
                .viewsCount(post.getViewsCount())
                .likesCount(post.getLikesCount())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
