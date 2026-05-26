package com.example.shelftotales.gamification.application;
import com.example.shelftotales.gamification.domain.*;
import com.example.shelftotales.gamification.infrastructure.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.auth.infrastructure.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.bookshelf.infrastructure.*;
import com.example.shelftotales.wishlist.infrastructure.*;
import com.example.shelftotales.review.infrastructure.*;
import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.social.infrastructure.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final FriendshipRepository friendshipRepository;
    private final ReadingStreakRepository streakRepository;
    private final BookRepository bookRepository;
    private final ReviewRepository reviewRepository;
    private final ShelfBookRepository shelfBookRepository;

    @Transactional
    public List<Achievement> evaluateAndAward(Long userId) {
        List<Achievement> newlyEarned = new ArrayList<>();
        List<Achievement> all = achievementRepository.findAll();

        for (Achievement achievement : all) {
            if (userAchievementRepository.existsByUserIdAndAchievementId(userId, achievement.getId())) {
                continue;
            }
            if (isEarned(userId, achievement)) {
                User user = userRepository.getReferenceById(userId);
                userAchievementRepository.save(UserAchievement.builder().user(user).achievement(achievement).build());
                newlyEarned.add(achievement);
            }
        }
        return newlyEarned;
    }

    private boolean isEarned(Long userId, Achievement achievement) {
        int value = achievement.getCriteriaValue();
        return switch (achievement.getCriteriaType()) {
            case "BOOKS_FINISHED" -> shelfBookRepository.countByBookshelfUserIdAndReadingStatus(userId, "COMPLETED") >= value;
            case "STREAK" -> streakRepository.findById(userId).map(s -> s.getLongestStreak() >= value).orElse(false);
            case "FRIENDS" -> friendshipRepository.countByUserId(userId) >= value;
            case "GENRES" -> bookRepository.countDistinctCategoriesByUserId(userId) >= value;
            case "REVIEWS" -> reviewRepository.countByUserId(userId) >= value;
            case "FOLLOWERS" -> followRepository.countByFollowingId(userId) >= value;
            default -> false;
        };
    }

    @Transactional(readOnly = true)
    public List<UserAchievement> getMyAchievements(Long userId) {
        return userAchievementRepository.findByUserId(userId);
    }
}
