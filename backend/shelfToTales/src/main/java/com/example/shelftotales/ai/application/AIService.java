package com.example.shelftotales.ai.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class AIService {

    private static final List<String> SPOILER_KEYWORDS = Arrays.asList(
            "spoiler", "spoilers", "dies", "dying", "death", "kills", "killed", 
            "murderer", "betrays", "betrayal", "ending", "turns out", "revealed", 
            "reveals", "plot twist", "murdered"
    );

    /**
     * Generates a deterministic, normalized 384-dimensional embedding vector based on input text hash.
     */
    public double[] generateEmbedding(String text) {
        double[] vector = new double[384];
        if (text == null || text.trim().isEmpty()) {
            vector[0] = 1.0;
            return vector;
        }

        // Seed random with text hash code to make it deterministic
        Random rand = new Random(text.hashCode());
        double sumSq = 0;
        for (int i = 0; i < 384; i++) {
            vector[i] = rand.nextGaussian();
            sumSq += vector[i] * vector[i];
        }

        // Normalize vector to unit length
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
