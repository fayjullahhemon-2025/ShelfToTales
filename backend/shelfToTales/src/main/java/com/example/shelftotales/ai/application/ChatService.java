package com.example.shelftotales.ai.application;

import com.example.shelftotales.ai.application.chat.*;
import com.example.shelftotales.ai.domain.*;
import com.example.shelftotales.ai.rag.PromptOrchestrator;
import com.example.shelftotales.ai.rag.RagRetriever;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.commerce.domain.Order;
import com.example.shelftotales.commerce.infrastructure.OrderRepository;
import com.example.shelftotales.bookshelf.infrastructure.ShelfBookRepository;
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
    /** Sentinel session key for unauthenticated visitors. User IDs are positive; -1L never collides. */
    private static final long ANONYMOUS_SESSION_ID = -1L;
    private static final String SYSTEM_PROMPT = """
            You are ShelfToTales, a friendly and knowledgeable bookstore customer support assistant.

            ## Your Capabilities
            - Recommend books from our catalog based on mood, genre, or preferences
            - Help with order status and purchase history questions
            - Answer questions about reading goals, achievements, and bookshelves
            - Explain how bookstore features work (exchanges, reading rooms, social features)
            - General bookstore inquiries

            ## Rules
            - Be helpful, friendly, and concise (2-4 sentences per response)
            - Use the provided context to answer accurately
            - For book recommendations, ALWAYS cite specific books from the catalog context by title
            - If you don't know something, say so honestly rather than making it up
            - Never fabricate order information — only use what's provided in the context
            - Ask ONE clarifying question if the user's request is vague
            """;

    private final OpenAIChatProvider openAIChatProvider;
    private final RuleBasedChatProvider ruleBasedChatProvider;
    private final EmbeddingService embeddingService;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ShelfBookRepository shelfBookRepository;
    private final RagRetriever ragRetriever;
    private final PromptOrchestrator promptOrchestrator;

    private final Map<Long, List<ChatMessage>> sessions = new ConcurrentHashMap<>();
    private final Map<Long, Long> sessionLastAccess = new ConcurrentHashMap<>();
    private static final long SESSION_TTL_MS = 30 * 60 * 1000;

    public ChatResponse chat(String userMessage) {
        evictStaleSessions();
        Optional<User> maybeUser = getOptionalCurrentUser();
        Long sessionKey = maybeUser.map(User::getId).orElse(ANONYMOUS_SESSION_ID);
        sessionLastAccess.put(sessionKey, System.currentTimeMillis());
        List<ChatMessage> history = sessions.computeIfAbsent(sessionKey, k -> new ArrayList<>());
        history.add(ChatMessage.user(userMessage));
        if (history.size() > MAX_HISTORY) history.subList(0, history.size() - MAX_HISTORY).clear();

        // Build conversation-aware search query
        String searchQuery = buildConversationQuery(history, userMessage);

        // RAG Retrieval: top-4 chunks, then resolve to books for display.
        var retrieved = ragRetriever.retrieve(searchQuery, 4);
        List<Map.Entry<Book, Double>> bookResults = new ArrayList<>();
        for (RetrievedChunk rc : retrieved) {
            Book book = embeddingService.findBookById(rc.chunk().getBookId());
            if (book != null) {
                bookResults.add(Map.entry(book, rc.score()));
            }
        }

        // Build multi-domain context
        String catalogContext = buildCatalogContext(bookResults);
        String orderContext = maybeUser.map(user -> buildOrderContext(user.getId()))
                .orElse("\n## Order History\n(Sign in to view orders)\n");
        String statsContext = maybeUser.map(user -> buildReadingStats(user.getId()))
                .orElse("\n## Reading Stats\n(Sign in to view reading stats)\n");
        String userContext = maybeUser.map(this::buildUserContext)
                .orElse("\n## User\n- Name: Guest\n- Member since: guest session\n");

        // Build conversation history context
        String historyContext = buildHistoryContext(history);

        // Assemble full system prompt with RAG context injected.
        String basePrompt = SYSTEM_PROMPT + "\n" +
            userContext + "\n" +
            orderContext + "\n" +
            statsContext + "\n" +
            catalogContext + "\n" +
            historyContext;
        String fullPrompt = promptOrchestrator.build(basePrompt, retrieved);

        String reply = openAIChatProvider.isAvailable()
                ? openAIChatProvider.chat(history, fullPrompt)
                : null;
        if (reply == null) reply = ruleBasedChatProvider.chat(history, fullPrompt);

        history.add(ChatMessage.assistant(reply));

        List<ChatResponse.BookRecommendation> recommendations = bookResults.stream()
                .map(e -> {
                    String reason = generateBookReason(e.getKey(), e.getValue(), maybeUser.map(User::getId).orElse(null));
                    return ChatResponse.BookRecommendation.builder()
                        .bookId(e.getKey().getId()).title(e.getKey().getTitle())
                        .author(e.getKey().getAuthor()).coverUrl(e.getKey().getCoverUrl())
                        .reason(reason).build();
                })
                .collect(Collectors.toList());

        return ChatResponse.builder().reply(reply).recommendations(recommendations).build();
    }

    public void clearSession() {
        Long sessionKey = getOptionalCurrentUser().map(User::getId).orElse(ANONYMOUS_SESSION_ID);
        sessions.remove(sessionKey);
        sessionLastAccess.remove(sessionKey);
    }

    private Optional<User> getOptionalCurrentUser() {
        String email = AuthUtils.getCurrentUserEmailOrNull();
        if (email == null) return Optional.empty();
        return userRepository.findByEmail(email);
    }

    private String buildConversationQuery(List<ChatMessage> history, String currentMessage) {
        if (history.size() < 2) return currentMessage;
        List<String> recentUserMessages = history.stream()
            .filter(m -> m.role().equals("user"))
            .map(ChatMessage::content)
            .collect(Collectors.toList());
        int start = Math.max(0, recentUserMessages.size() - 2);
        return String.join(" ", recentUserMessages.subList(start, recentUserMessages.size()));
    }

    private String buildCatalogContext(List<Map.Entry<Book, Double>> results) {
        StringBuilder ctx = new StringBuilder("\n## Available Books in our Catalog\n");
        if (results.isEmpty()) {
            ctx.append("(No matching books found. Suggest exploring other genres or ask for clarification.)\n");
        } else {
            for (Map.Entry<Book, Double> entry : results) {
                Book b = entry.getKey();
                ctx.append("- \"").append(b.getTitle()).append("\" by ").append(b.getAuthor());
                if (b.getCategory() != null) ctx.append(" [Genre: ").append(b.getCategory().getName()).append("]");
                if (b.getDescription() != null) {
                    String desc = b.getDescription();
                    if (desc.length() > 150) desc = desc.substring(0, 150) + "...";
                    ctx.append(" — ").append(desc);
                }
                ctx.append("\n");
            }
        }
        return ctx.toString();
    }

    private String buildOrderContext(Long userId) {
        try {
            List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(userId);
            if (orders.isEmpty()) return "\n## Order History\n(No orders yet)\n";
            StringBuilder ctx = new StringBuilder("\n## Recent Order History\n");
            int count = 0;
            for (Order order : orders) {
                if (count >= 3) break;
                ctx.append("- Order #").append(order.getId())
                   .append(": ").append(order.getItems() != null ? order.getItems().size() : 0).append(" items")
                   .append(", Total: $").append(order.getTotalAmount())
                   .append(", Status: ").append(order.getStatus());
                if (order.getOrderDate() != null) ctx.append(", Date: ").append(order.getOrderDate().toLocalDate());
                ctx.append("\n");
                count++;
            }
            return ctx.toString();
        } catch (Exception e) {
            return "\n## Order History\n(Unavailable)\n";
        }
    }

    private String buildReadingStats(Long userId) {
        try {
            int completed = shelfBookRepository.findBookIdsByUserIdAndStatus(userId, "COMPLETED").size();
            int reading = shelfBookRepository.findBookIdsByUserIdAndStatus(userId, "READING").size();
            return "\n## Reading Stats\n- Books completed: " + completed + "\n- Currently reading: " + reading + "\n";
        } catch (Exception e) {
            return "\n## Reading Stats\n(Unavailable)\n";
        }
    }

    private String buildUserContext(User user) {
        return "\n## User\n- Name: " + (user.getFullName() != null ? user.getFullName() : "Reader") +
               "\n- Member since: " + (user.getCreatedAt() != null ? user.getCreatedAt().toLocalDate() : "recently") + "\n";
    }

    private String buildHistoryContext(List<ChatMessage> history) {
        if (history.size() <= 1) return "";
        StringBuilder ctx = new StringBuilder("\n## Recent Conversation\n");
        int start = Math.max(0, history.size() - 5);
        for (int i = start; i < history.size() - 1; i++) {
            ChatMessage msg = history.get(i);
            ctx.append(msg.role()).append(": ").append(msg.content()).append("\n");
        }
        return ctx.toString();
    }

    private String generateBookReason(Book book, double score, Long userId) {
        if (score > 0.9) return "Strongly matches your reading taste";
        if (score > 0.7) return "Great match based on your profile";
        if (book.getCategory() != null) return "Popular in " + book.getCategory().getName();
        return "Recommended based on your interests";
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
