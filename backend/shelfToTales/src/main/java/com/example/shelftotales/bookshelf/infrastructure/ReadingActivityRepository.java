package com.example.shelftotales.bookshelf.infrastructure;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.bookshelf.domain.ReadingActivity;
import com.example.shelftotales.bookshelf.domain.ReadingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReadingActivityRepository extends JpaRepository<ReadingActivity, Long> {

    @Query("SELECT ra FROM ReadingActivity ra JOIN FETCH ra.book WHERE ra.user.id = :userId AND ra.status = :status ORDER BY ra.lastReadAt DESC")
    List<ReadingActivity> findByUserIdAndStatusOrderByLastReadAtDesc(Long userId, ReadingStatus status);

    long countByUserIdAndStatus(Long userId, ReadingStatus status);

    @Query("SELECT COALESCE(SUM(ra.totalPagesRead), 0) FROM ReadingActivity ra WHERE ra.user.id = :userId")
    int sumTotalPagesReadByUserId(Long userId);

    @Query("SELECT ra FROM ReadingActivity ra JOIN FETCH ra.book WHERE ra.user.id = :userId ORDER BY ra.lastReadAt DESC")
    List<ReadingActivity> findAllByUserIdOrderByLastReadAtDesc(Long userId);
}
