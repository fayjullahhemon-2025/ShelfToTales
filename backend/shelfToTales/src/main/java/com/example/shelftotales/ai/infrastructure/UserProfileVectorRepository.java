package com.example.shelftotales.ai.infrastructure;
import com.example.shelftotales.ai.domain.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserProfileVectorRepository extends JpaRepository<UserProfileVector, Long> {
}
