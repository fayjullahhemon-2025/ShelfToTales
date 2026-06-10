package com.example.shelftotales.ai.application;

import com.example.shelftotales.ai.application.chat.*;
import com.example.shelftotales.ai.domain.*;

import com.example.shelftotales.ai.application.ChatResponse;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int MAX_HISTORY = 10;
    private static final String SYSTEM_PROMPT = """
            You are a book recommendation assistant for ShelfToTales.
            Keep responses concise (2-3 sentences + recommendations).
            Ask ONE clarifying question if the user's request is vague.
            When recommending, suggest 3-5 books with brief reasons why.""";

    private final OpenAIChatProvider openAIChatProvider;
    private final RuleBasedChatProvider ruleBasedChatProvider;
    private final EmbeddingService embeddingService;
    private final UserRepository userRepository;

    private final Map<Long, List<ChatMessage>> sessions = new ConcurrentHashMap<>();
    private final Map<Long, Long> sessionLastAccess = new ConcurrentHashMap<>();
    private static final long SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

    public ChatResponse chat(String userMessage) {
        evictStaleSessions();
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        sessionLastAccess.put(currentUser.getId(), System.currentTimeMillis());
        List<ChatMessage> history = sessions.computeIfAbsent(currentUser.getId(), k -> new ArrayList<>());
        history.add(ChatMessage.user(userMessage));
        if (history.size() > MAX_HISTORY) history.subList(0, history.size() - MAX_HISTORY).clear();

        // RAG Retrieval: fetch top 4 similar books from database catalog
        List<Map.Entry<Book, Double>> results = embeddingService.searchSimilar(userMessage, 4, null);

        // Construct Catalog Context for the LLM
        StringBuilder catalogCtx = new StringBuilder("\n\nAvailable Books in our Catalog matching user's search:\n");
        if (results.isEmpty()) {
            catalogCtx.append("(No direct matches found in database. Recommend generic matching genres or ask for clarification.)\n");
        } else {
            for (Map.Entry<Book, Double> entry : results) {
                Book b = entry.getKey();
                catalogCtx.append("- ID: ").append(b.getId())
                          .append(", Title: \"").append(b.getTitle()).append("\"")
                          .append(", Author: \"").append(b.getAuthor()).append("\"");
                if (b.getCategory() != null) {
                    catalogCtx.append(", Genre: \"").append(b.getCategory().getName()).append("\"");
                }
                if (b.getDescription() != null) {
                    catalogCtx.append(", Description: \"").append(b.getDescription()).append("\"");
                }
                catalogCtx.append("\n");
            }
        }

        // Constrain System Prompt
        String ragSystemPrompt = SYSTEM_PROMPT + "\n\n" +
            "You MUST recommend books ONLY from the 'Available Books in our Catalog' list below. " +
            "Explain why you selected them based on their descriptions. Do not suggest titles not listed. " +
            "If the list is empty, explain that we don't have matching books right now and recommend exploring other genres.\n" +
            catalogCtx.toString();

        String reply = openAIChatProvider.isAvailable()
                ? openAIChatProvider.chat(history, ragSystemPrompt)
                : null;
        if (reply == null) reply = ruleBasedChatProvider.chat(history, ragSystemPrompt);

        history.add(ChatMessage.assistant(reply));

        List<ChatResponse.BookRecommendation> recommendations = results.stream()
                .map(e -> ChatResponse.BookRecommendation.builder()
                        .bookId(e.getKey().getId()).title(e.getKey().getTitle())
                        .author(e.getKey().getAuthor()).coverUrl(e.getKey().getCoverUrl())
                        .reason("Highly relevant match in our catalog").build())
                .collect(Collectors.toList());

        return ChatResponse.builder().reply(reply).recommendations(recommendations).build();
    }

    public void clearSession() {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        sessions.remove(currentUser.getId());
        sessionLastAccess.remove(currentUser.getId());
    }

    private void evictStaleSessions() {
        long now = System.currentTimeMillis();
        sessionLastAccess.entrySet().removeIf(entry -> {
            if (now - entry.getValue() > SESSION_TTL_MS) {
                sessions.remove(entry.getKey());
                return true;
            }
            return false;
        });
    }
}
