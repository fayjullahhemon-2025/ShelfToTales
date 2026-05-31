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

        String reply = openAIChatProvider.isAvailable()
                ? openAIChatProvider.chat(history, SYSTEM_PROMPT)
                : null;
        if (reply == null) reply = ruleBasedChatProvider.chat(history, SYSTEM_PROMPT);

        history.add(ChatMessage.assistant(reply));

        List<Map.Entry<Book, Double>> results = embeddingService.searchSimilar(userMessage, 5, null);
        List<ChatResponse.BookRecommendation> recommendations = results.stream()
                .map(e -> ChatResponse.BookRecommendation.builder()
                        .bookId(e.getKey().getId()).title(e.getKey().getTitle())
                        .author(e.getKey().getAuthor()).coverUrl(e.getKey().getCoverUrl())
                        .reason("Matches your description").build())
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
