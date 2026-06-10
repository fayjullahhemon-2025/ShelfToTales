package com.example.shelftotales.event.observer;

import com.example.shelftotales.event.BookCompletedEvent;
import com.example.shelftotales.event.OrderConfirmedEvent;
import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.auth.infrastructure.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.bookshelf.infrastructure.*;
import com.example.shelftotales.commerce.infrastructure.OrderRepository;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProfileVectorObserver {

    private final UserProfileVectorRepository profileVectorRepository;
    private final BookEmbeddingRepository bookEmbeddingRepository;
    private final ShelfBookRepository shelfBookRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final AIService aiService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onBookCompleted(BookCompletedEvent event) {
        try {
            recalculateUserVector(event.getActorId());
        } catch (Exception e) {
            log.warn("Failed to update profile vector for user {} on book completion: {}", event.getActorId(), e.getMessage());
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onOrderConfirmed(OrderConfirmedEvent event) {
        try {
            recalculateUserVector(event.getActorId());
        } catch (Exception e) {
            log.warn("Failed to update profile vector for user {} on order confirmation: {}", event.getActorId(), e.getMessage());
        }
    }

    private void recalculateUserVector(Long userId) {
        List<Long> completedBookIds = shelfBookRepository.findBookIdsByUserIdAndStatus(userId, "COMPLETED");
        List<Long> readingBookIds = shelfBookRepository.findBookIdsByUserIdAndStatus(userId, "READING");
        List<Long> boughtBookIds = orderRepository.findBoughtBookIdsByUserId(userId);

        if (completedBookIds.isEmpty() && readingBookIds.isEmpty() && boughtBookIds.isEmpty()) {
            return;
        }

        Map<Long, Double> bookWeights = new HashMap<>();
        for (Long id : boughtBookIds) {
            bookWeights.put(id, 1.2);
        }
        for (Long id : readingBookIds) {
            bookWeights.merge(id, 1.0, Math::max);
        }
        for (Long id : completedBookIds) {
            bookWeights.merge(id, 1.5, Math::max);
        }

        List<BookEmbedding> userEmbeddings = bookEmbeddingRepository.findAllById(bookWeights.keySet());
        if (userEmbeddings.isEmpty()) return;

        double[] avgVector = new double[384];
        double totalWeight = 0;
        for (BookEmbedding emb : userEmbeddings) {
            double weight = bookWeights.getOrDefault(emb.getBookId(), 1.0);
            double[] vec = aiService.stringToVector(emb.getVectorData());
            if (vec.length == 384) {
                for (int i = 0; i < 384; i++) {
                    avgVector[i] += vec[i] * weight;
                }
                totalWeight += weight;
            }
        }
        if (totalWeight == 0) return;
        for (int i = 0; i < 384; i++) avgVector[i] /= totalWeight;

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
