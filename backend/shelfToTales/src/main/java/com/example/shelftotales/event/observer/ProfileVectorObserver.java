package com.example.shelftotales.event.observer;

import com.example.shelftotales.event.BookCompletedEvent;
import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.auth.infrastructure.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.bookshelf.infrastructure.*;
import com.example.shelftotales.ai.application.AIService;
import com.example.shelftotales.ai.infrastructure.UserProfileVectorRepository;
import com.example.shelftotales.ai.domain.UserProfileVector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProfileVectorObserver {

    private final UserProfileVectorRepository profileVectorRepository;
    private final BookEmbeddingRepository bookEmbeddingRepository;
    private final ShelfBookRepository shelfBookRepository;
    private final UserRepository userRepository;
    private final AIService aiService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onBookCompleted(BookCompletedEvent event) {
        try {
            recalculateUserVector(event.getActorId());
        } catch (Exception e) {
            log.warn("Failed to update profile vector for user {}: {}", event.getActorId(), e.getMessage());
        }
    }

    private void recalculateUserVector(Long userId) {
        // Get IDs of books the user has completed
        List<Long> completedBookIds = shelfBookRepository.findCompletedBookIdsByUserId(userId);
        if (completedBookIds.isEmpty()) return;

        // Only average embeddings for user's completed books
        List<BookEmbedding> userEmbeddings = bookEmbeddingRepository.findAllById(completedBookIds);
        if (userEmbeddings.isEmpty()) return;

        double[] avgVector = new double[384];
        int count = 0;
        for (BookEmbedding emb : userEmbeddings) {
            double[] vec = aiService.stringToVector(emb.getVectorData());
            if (vec.length == 384) {
                for (int i = 0; i < 384; i++) avgVector[i] += vec[i];
                count++;
            }
        }
        if (count == 0) return;
        for (int i = 0; i < 384; i++) avgVector[i] /= count;

        // Normalize
        double norm = 0;
        for (double v : avgVector) norm += v * v;
        norm = Math.sqrt(norm);
        if (norm > 0) for (int i = 0; i < 384; i++) avgVector[i] /= norm;

        User user = userRepository.getReferenceById(userId);
        UserProfileVector profile = profileVectorRepository.findById(userId)
                .orElse(UserProfileVector.builder().user(user).userId(userId).build());
        profile.setVectorData(aiService.vectorToString(avgVector));
        profileVectorRepository.save(profile);
    }
}
