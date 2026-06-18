package com.example.shelftotales.ai.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SearchClickRepository extends JpaRepository<SearchClick, Long> {
}
