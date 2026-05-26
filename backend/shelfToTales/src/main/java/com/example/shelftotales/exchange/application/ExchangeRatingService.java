package com.example.shelftotales.exchange.application;
import com.example.shelftotales.exchange.domain.*;
import com.example.shelftotales.exchange.infrastructure.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExchangeRatingService {

    private final ExchangeRatingRepository ratingRepository;
    private final ExchangeRequestRepository requestRepository;
    private final UserRepository userRepository;

    @Transactional
    public ExchangeRating rate(Long requestId, int score, String comment) {
        User rater = AuthUtils.getCurrentUser(userRepository);
        ExchangeRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (!"COMPLETED".equals(request.getStatus())) {
            throw new IllegalStateException("Can only rate completed exchanges");
        }

        // Determine ratee (the other party)
        Long listerId = request.getListing().getUser().getId();
        Long requesterId = request.getRequester().getId();

        if (!rater.getId().equals(listerId) && !rater.getId().equals(requesterId)) {
            throw new IllegalArgumentException("Not a participant in this exchange");
        }

        if (ratingRepository.existsByExchangeRequestIdAndRaterId(requestId, rater.getId())) {
            throw new IllegalArgumentException("Already rated this exchange");
        }

        Long rateeId = rater.getId().equals(listerId) ? requesterId : listerId;
        User ratee = userRepository.getReferenceById(rateeId);

        ExchangeRating rating = ExchangeRating.builder()
                .exchangeRequest(request).rater(rater).ratee(ratee)
                .score(score).comment(comment).build();
        return ratingRepository.save(rating);
    }

    @Transactional(readOnly = true)
    public Double getTrustScore(Long userId) {
        return ratingRepository.findAverageScoreByRateeId(userId);
    }

    @Transactional(readOnly = true)
    public List<ExchangeRating> getRatings(Long userId) {
        return ratingRepository.findByRateeIdOrderByCreatedAtDesc(userId);
    }
}
