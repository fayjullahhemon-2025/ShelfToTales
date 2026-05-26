package com.example.shelftotales.service;
import com.example.shelftotales.review.domain.*;
import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.auth.application.*;
import com.example.shelftotales.auth.infrastructure.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.catalog.application.*;
import com.example.shelftotales.catalog.infrastructure.*;
import com.example.shelftotales.bookshelf.domain.*;
import com.example.shelftotales.bookshelf.application.*;
import com.example.shelftotales.bookshelf.infrastructure.*;
import com.example.shelftotales.bookshelf.presentation.*;
import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.application.*;
import com.example.shelftotales.commerce.infrastructure.*;
import com.example.shelftotales.social.domain.*;
import com.example.shelftotales.social.application.*;
import com.example.shelftotales.social.infrastructure.*;
import com.example.shelftotales.gamification.domain.*;
import com.example.shelftotales.gamification.application.*;
import com.example.shelftotales.gamification.infrastructure.*;
import com.example.shelftotales.exchange.domain.*;
import com.example.shelftotales.exchange.application.*;
import com.example.shelftotales.exchange.infrastructure.*;
import com.example.shelftotales.ai.application.*;
import com.example.shelftotales.readingroom.domain.*;
import com.example.shelftotales.readingroom.application.*;
import com.example.shelftotales.readingroom.infrastructure.*;
import com.example.shelftotales.review.application.*;
import com.example.shelftotales.review.infrastructure.*;
import com.example.shelftotales.wishlist.application.*;
import com.example.shelftotales.wishlist.infrastructure.*;
import com.example.shelftotales.shared.security.*;
import com.example.shelftotales.shared.util.*;
import com.example.shelftotales.auth.presentation.*;
import com.example.shelftotales.shared.dto.*;

import com.example.shelftotales.ai.application.AIService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;

public class AIServiceTest {

    private AIService aiService;

    @BeforeEach
    public void setUp() {
        aiService = new AIService();
    }

    @Test
    public void testGenerateEmbedding() {
        String text = "Cosmology and the universe study.";
        double[] vector = aiService.generateEmbedding(text);

        assertNotNull(vector);
        assertEquals(384, vector.length);

        // Verify magnitude is close to 1.0 (normalized)
        double sumSq = 0.0;
        for (double val : vector) {
            sumSq += val * val;
        }
        double magnitude = Math.sqrt(sumSq);
        assertEquals(1.0, magnitude, 1e-6);

        // Verify deterministic behavior
        double[] vector2 = aiService.generateEmbedding(text);
        assertArrayEquals(vector, vector2);
    }

    @Test
    public void testVectorSerialization() {
        double[] original = {0.1, -0.5, 0.999};
        String serialized = aiService.vectorToString(original);
        double[] deserialized = aiService.stringToVector(serialized);

        assertNotNull(deserialized);
        assertEquals(3.0, deserialized.length);
        assertEquals(0.1, deserialized[0], 1e-6);
        assertEquals(-0.5, deserialized[1], 1e-6);
        assertEquals(0.999, deserialized[2], 1e-6);
    }

    @Test
    public void testCalculateSimilarity() {
        double[] vecA = {1.0, 0.0, 0.0};
        double[] vecB = {1.0, 0.0, 0.0};
        double similarityMatch = aiService.calculateSimilarity(vecA, vecB);
        assertEquals(1.0, similarityMatch, 1e-6);

        double[] vecC = {0.0, 1.0, 0.0};
        double similarityOrthogonal = aiService.calculateSimilarity(vecA, vecC);
        assertEquals(0.0, similarityOrthogonal, 1e-6);
    }

    @Test
    public void testIsSpoilerReview() {
        assertFalse(aiService.isSpoilerReview("I love this book, it was a wonderful read."));
        assertFalse(aiService.isSpoilerReview(null));
        assertFalse(aiService.isSpoilerReview(""));

        assertTrue(aiService.isSpoilerReview("Wait, I hate that he dies at the end of the chapter!"));
        assertTrue(aiService.isSpoilerReview("Major spoiler alert: she is the actual murderer!"));
    }

    @Test
    public void testExtractMoods() {
        Set<String> moodsClassic = aiService.extractMoods("A cozy classic romance set in Georgian England.");
        assertTrue(moodsClassic.contains("cozy"));

        Set<String> moodsDystopia = aiService.extractMoods("A dark, bleak dystopian future of total control and death.");
        assertTrue(moodsDystopia.contains("melancholic"));
        assertTrue(moodsDystopia.contains("suspenseful"));

        Set<String> moodsSpace = aiService.extractMoods("An adventurous space exploration saga.");
        assertTrue(moodsSpace.contains("adventurous"));
    }
}
