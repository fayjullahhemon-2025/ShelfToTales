package com.example.shelftotales.ai.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class AIService {

    private static final Map<String, Integer> GENRE_DIMENSIONS = Map.of(
        "sci-fi", 0, "science fiction", 0, "fantasy", 1, "mystery", 2, "thriller", 3,
        "romance", 4, "horror", 5, "nonfiction", 6, "biography", 7, "history", 8,
        "poetry", 9, "classics", 10, "young adult", 11, "children", 12, "self-help", 13,
        "philosophy", 14, "religion", 15, "art", 16, "cookbook", 17, "travel", 18, "science", 19
    );

    private static final List<String> SPOILER_KEYWORDS = Arrays.asList(
            "spoiler", "spoilers", "dies", "dying", "death", "kills", "killed", 
            "murderer", "betrays", "betrayal", "ending", "turns out", "revealed", 
            "reveals", "plot twist", "murdered"
    );

    public double[] generateEmbedding(String text) {
        double[] vector = new double[384];
        if (text == null || text.trim().isEmpty()) {
            vector[0] = 1.0;
            return vector;
        }

        Random rand = new Random(text.hashCode());
        double sumSq = 0;
        for (int i = 0; i < 384; i++) {
            vector[i] = rand.nextGaussian();
            sumSq += vector[i] * vector[i];
        }

        // Boost dimensions based on detected genre keywords
        String lowerText = text.toLowerCase();
        for (Map.Entry<String, Integer> entry : GENRE_DIMENSIONS.entrySet()) {
            if (lowerText.contains(entry.getKey())) {
                int dim = entry.getValue();
                vector[dim] += 2.0;
                sumSq += 4.0;
            }
        }

        double magnitude = Math.sqrt(sumSq);
        if (magnitude > 0) {
            for (int i = 0; i < 384; i++) {
                vector[i] /= magnitude;
            }
        } else {
            vector[0] = 1.0;
        }
        return vector;
    }

    /**
     * Parses a double array into a comma-separated String of values.
     */
    public String vectorToString(double[] vector) {
        if (vector == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < vector.length; i++) {
            sb.append(vector[i]);
            if (i < vector.length - 1) {
                sb.append(",");
            }
        }
        return sb.toString();
    }

    /**
     * Parses a comma-separated String of values back into a double array.
     */
    public double[] stringToVector(String str) {
        if (str == null || str.trim().isEmpty()) {
            return new double[384];
        }
        String[] parts = str.split(",");
        double[] vector = new double[parts.length];
        for (int i = 0; i < parts.length; i++) {
            vector[i] = Double.parseDouble(parts[i]);
        }
        return vector;
    }

    /**
     * Calculates the cosine similarity (dot product of normalized vectors) between two vectors.
     */
    public double calculateSimilarity(double[] vecA, double[] vecB) {
        if (vecA == null || vecB == null || vecA.length != vecB.length) {
            return 0.0;
        }
        double dotProduct = 0.0;
        for (int i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
        }
        return dotProduct;
    }

    /**
     * Automatically scans text to classify if it contains spoilers.
     */
    public boolean isSpoilerReview(String comment) {
        if (comment == null || comment.trim().isEmpty()) {
            return false;
        }
        String lowerComment = comment.toLowerCase();
        for (String keyword : SPOILER_KEYWORDS) {
            if (lowerComment.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Inspects text content to extract a set of appropriate moods.
     */
    public Set<String> extractMoods(String text) {
        Set<String> moods = new HashSet<>();
        if (text == null || text.trim().isEmpty()) {
            moods.add("reflective");
            return moods;
        }
        String lowerText = text.toLowerCase();
        if (lowerText.contains("dark") || lowerText.contains("death") || lowerText.contains("dystopian") || lowerText.contains("totalitarian")) {
            moods.add("melancholic");
            moods.add("suspenseful");
        }
        if (lowerText.contains("hobbit") || lowerText.contains("journey") || lowerText.contains("epic") || lowerText.contains("planet") || lowerText.contains("space")) {
            moods.add("adventurous");
        }
        if (lowerText.contains("home") || lowerText.contains("cozy") || lowerText.contains("classic") || lowerText.contains("romance") || lowerText.contains("manners")) {
            moods.add("cozy");
        }
        if (lowerText.contains("cosmology") || lowerText.contains("history") || lowerText.contains("universe") || lowerText.contains("science")) {
            moods.add("reflective");
        }

        if (moods.isEmpty()) {
            moods.add("reflective");
        }
        return moods;
    }
}
