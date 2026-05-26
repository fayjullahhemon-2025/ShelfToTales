package com.example.shelftotales.readingroom.infrastructure;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.readingroom.domain.ReadingRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReadingRoomRepository extends JpaRepository<ReadingRoom, Long> {
    List<ReadingRoom> findAllByOrderByCreatedAtDesc();
}
