package com.example.shelftotales.social.infrastructure;

import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.auth.domain.User;

import com.example.shelftotales.auth.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface SocialActivityRepository extends JpaRepository<SocialActivity, Long> {
    List<SocialActivity> findByUserInOrderByCreatedAtDesc(Collection<User> users);
    List<SocialActivity> findByUserIdOrderByCreatedAtDesc(Long userId);
}
