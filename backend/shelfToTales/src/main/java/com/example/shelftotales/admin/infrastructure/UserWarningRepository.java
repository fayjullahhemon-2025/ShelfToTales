package com.example.shelftotales.admin.infrastructure;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.admin.domain.*;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserWarningRepository extends JpaRepository<UserWarning, Long> {
    List<UserWarning> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserId(Long userId);
}
