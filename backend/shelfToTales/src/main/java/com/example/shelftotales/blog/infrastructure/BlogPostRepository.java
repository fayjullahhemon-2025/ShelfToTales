package com.example.shelftotales.blog.infrastructure;

import com.example.shelftotales.blog.domain.BlogPost;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    List<BlogPost> findByAuthorId(Long authorId);
    List<BlogPost> findByStatus(String status);
}
