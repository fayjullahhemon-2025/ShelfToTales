package com.example.shelftotales.blog.application;

import com.example.shelftotales.auth.domain.User;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import com.example.shelftotales.blog.domain.BlogPost;
import com.example.shelftotales.blog.infrastructure.BlogPostRepository;
import com.example.shelftotales.event.BlogCreatedEvent;
import com.example.shelftotales.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlogPostService {
    private final BlogPostRepository blogPostRepository;
    private final ApplicationEventPublisher eventPublisher;

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
                .content(sanitizeHtml(request.getContent()))
                .coverImage(request.getCoverImage())
                .status(request.getStatus() != null ? request.getStatus() : "PUBLISHED")
                .build();
        BlogPost saved = blogPostRepository.save(post);
        eventPublisher.publishEvent(new BlogCreatedEvent(
                author.getId(), saved.getId(), saved.getTitle(),
                saved.getContent() != null && saved.getContent().length() > 200
                        ? saved.getContent().substring(0, 200)
                        : saved.getContent()));
        return mapToResponse(saved);
    }

    @Transactional
    public BlogPostResponse update(Long id, BlogPostRequest request, Long userId) {
        BlogPost post = blogPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blog post not found: " + id));
        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("You are not the author of this post");
        }
        post.setTitle(request.getTitle());
        post.setContent(sanitizeHtml(request.getContent()));
        post.setCoverImage(request.getCoverImage());
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
                .coverImage(post.getCoverImage())
                .status(post.getStatus())
                .viewsCount(post.getViewsCount())
                .likesCount(post.getLikesCount())
                .createdAt(post.getCreatedAt())
                .build();
    }

    private String sanitizeHtml(String html) {
        if (html == null) return null;
        Safelist safelist = Safelist.relaxed()
                .addTags("iframe")
                .addAttributes("iframe", "src", "width", "height", "frameborder", "allow", "allowfullscreen", "allow", "class", "style")
                .addAttributes(":all", "class", "style")
                .addProtocols("iframe", "src", "http", "https")
                .addProtocols("a", "href", "http", "https", "mailto", "tel")
                .preserveRelativeLinks(true);
        return Jsoup.clean(html, "", safelist, new org.jsoup.nodes.Document.OutputSettings().prettyPrint(false));
    }
}
