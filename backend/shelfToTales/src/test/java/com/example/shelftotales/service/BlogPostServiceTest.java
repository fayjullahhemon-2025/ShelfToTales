package com.example.shelftotales.service;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.blog.application.BlogPostRequest;
import com.example.shelftotales.blog.application.BlogPostResponse;
import com.example.shelftotales.blog.application.BlogPostService;
import com.example.shelftotales.blog.domain.BlogPost;
import com.example.shelftotales.blog.infrastructure.BlogPostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BlogPostServiceTest {

    @Mock
    private BlogPostRepository blogPostRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private BlogPostService blogPostService;

    private User author;

    @BeforeEach
    void setUp() {
        author = User.builder()
                .id(1L)
                .email("author@example.com")
                .fullName("Author Name")
                .build();
    }

    @Test
    void testCreateBlogPostSanitizesHtml() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("Unsafe Post")
                .content("<p>Hello</p><script>alert('XSS')</script><iframe src='javascript:alert(1)'></iframe><a href='javascript:void(0)' class='link'>Click</a>")
                .status("PUBLISHED")
                .build();

        ArgumentCaptor<BlogPost> postCaptor = ArgumentCaptor.forClass(BlogPost.class);
        
        when(blogPostRepository.save(any(BlogPost.class))).thenAnswer(invocation -> {
            BlogPost saved = invocation.getArgument(0);
            return saved;
        });

        BlogPostResponse response = blogPostService.create(request, author);

        verify(blogPostRepository).save(postCaptor.capture());
        BlogPost captured = postCaptor.getValue();

        System.out.println("--- SANITIZED CONTENT: " + captured.getContent());

        assertNotNull(captured);
        // Script and iframe with javascript src should be removed/sanitized.
        assertFalse(captured.getContent().contains("<script>"));
        assertFalse(captured.getContent().contains("javascript:"));
        // Safe elements/attributes should be preserved.
        assertTrue(captured.getContent().contains("<p>Hello</p>"));
        assertTrue(captured.getContent().contains("class=\"link\""));
    }

    @Test
    void testUpdateBlogPostSanitizesHtml() {
        BlogPost existingPost = BlogPost.builder()
                .id(10L)
                .author(author)
                .title("Original Title")
                .content("Original Content")
                .status("PUBLISHED")
                .build();

        BlogPostRequest request = BlogPostRequest.builder()
                .title("Updated Title")
                .content("Updated <div onclick='exploit()'>Content</div><iframe src='https://youtube.com/embed/123'></iframe>")
                .status("PUBLISHED")
                .build();

        when(blogPostRepository.findById(10L)).thenReturn(java.util.Optional.of(existingPost));
        when(blogPostRepository.save(any(BlogPost.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BlogPostResponse response = blogPostService.update(10L, request, 1L);

        ArgumentCaptor<BlogPost> postCaptor = ArgumentCaptor.forClass(BlogPost.class);
        verify(blogPostRepository).save(postCaptor.capture());
        BlogPost captured = postCaptor.getValue();

        assertNotNull(captured);
        // onclick attribute must be sanitized
        assertFalse(captured.getContent().contains("onclick"));
        // Safe iframe should be allowed
        assertTrue(captured.getContent().contains("iframe"));
        assertTrue(captured.getContent().contains("https://youtube.com/embed/123"));
    }
}
