package com.example.shelftotales.service;

import com.example.shelftotales.ai.application.ChatResponse;
import com.example.shelftotales.ai.application.ChatService;
import com.example.shelftotales.ai.application.EmbeddingService;
import com.example.shelftotales.ai.application.chat.OpenAIChatProvider;
import com.example.shelftotales.ai.application.chat.RuleBasedChatProvider;
import com.example.shelftotales.ai.domain.ChatMessage;
import com.example.shelftotales.ai.rag.PromptOrchestrator;
import com.example.shelftotales.ai.rag.RagRetriever;
import com.example.shelftotales.auth.domain.Role;
import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.bookshelf.infrastructure.ShelfBookRepository;
import com.example.shelftotales.commerce.infrastructure.OrderRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ChatServiceTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void chat_guestUsesRuleBasedProviderWithoutUserLookup() {
        SecurityContextHolder.clearContext();
        TrackingUserRepository userRepository = new TrackingUserRepository(null, true);
        TrackingOrderRepository orderRepository = new TrackingOrderRepository(true);
        TrackingShelfBookRepository shelfBookRepository = new TrackingShelfBookRepository(true);
        FakeRuleBasedChatProvider ruleBased = new FakeRuleBasedChatProvider("Hello, Guest!");
        ChatService chatService = new ChatService(
                new FakeOpenAIChatProvider(false),
                ruleBased,
                null,
                userRepository.proxy(),
                orderRepository.proxy(),
                shelfBookRepository.proxy(),
                new EmptyRagRetriever(),
                new PromptOrchestrator()
        );

        ChatResponse response = chatService.chat("hello");

        assertEquals("Hello, Guest!", response.getReply());
        assertEquals(0, userRepository.findByEmailCalls);
        assertEquals(0, orderRepository.findOrdersCalls);
        assertEquals(0, shelfBookRepository.findStatusCalls);
        assertEquals(true, ruleBased.lastPrompt.contains("Guest")); // exact phrasing now lives in ChatService.GUEST_USER constant
    }

    @Test
    void chat_authenticatedUserAddsPrivateContext() {
        User user = User.builder()
                .id(42L)
                .email("reader@example.com")
                .fullName("Reader One")
                .role(Role.USER)
                .createdAt(LocalDateTime.of(2026, 1, 2, 3, 4))
                .build();
        TestingAuthenticationToken authentication = new TestingAuthenticationToken("reader@example.com", null);
        authentication.setAuthenticated(true);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        TrackingUserRepository userRepository = new TrackingUserRepository(user, false);
        TrackingShelfBookRepository shelfBookRepository = new TrackingShelfBookRepository(false);
        FakeRuleBasedChatProvider ruleBased = new FakeRuleBasedChatProvider("You completed 2 books.");
        ChatService chatService = new ChatService(
                new FakeOpenAIChatProvider(false),
                ruleBased,
                null,
                userRepository.proxy(),
                new TrackingOrderRepository(false).proxy(),
                shelfBookRepository.proxy(),
                new EmptyRagRetriever(),
                new PromptOrchestrator()
        );

        ChatResponse response = chatService.chat("my stats");

        assertEquals("You completed 2 books.", response.getReply());
        assertEquals(1, userRepository.findByEmailCalls);
        assertEquals(2, shelfBookRepository.findStatusCalls);
        assertEquals(true, ruleBased.lastPrompt.contains("Reader One"));
        assertEquals(true, ruleBased.lastPrompt.contains("Books completed: 2"));
    }

    private static class FakeOpenAIChatProvider extends OpenAIChatProvider {
        private final boolean available;

        FakeOpenAIChatProvider(boolean available) {
            super(null);
            this.available = available;
        }

        @Override
        public boolean isAvailable() {
            return available;
        }

        @Override
        public String chat(List<ChatMessage> history, String systemPrompt) {
            return null;
        }
    }

    private static class FakeRuleBasedChatProvider extends RuleBasedChatProvider {
        private final String response;
        private String lastPrompt = "";

        FakeRuleBasedChatProvider(String response) {
            super(null);
            this.response = response;
        }

        @Override
        public String chat(List<ChatMessage> history, String systemPrompt) {
            this.lastPrompt = systemPrompt;
            return response;
        }
    }

    private static class EmptyRagRetriever extends RagRetriever {
        EmptyRagRetriever() {
            super(null, null, null, null);
        }

        @Override
        public List<com.example.shelftotales.ai.domain.RetrievedChunk> retrieve(String query, int topK) {
            return List.of();
        }
    }

    private static class TrackingUserRepository {
        private final User user;
        private final boolean failOnFind;
        private int findByEmailCalls;

        TrackingUserRepository(User user, boolean failOnFind) {
            this.user = user;
            this.failOnFind = failOnFind;
        }

        UserRepository proxy() {
            return (UserRepository) Proxy.newProxyInstance(
                    UserRepository.class.getClassLoader(),
                    new Class<?>[]{UserRepository.class},
                    (proxy, method, args) -> {
                        if ("findByEmail".equals(method.getName())) {
                            findByEmailCalls++;
                            if (failOnFind) throw new AssertionError("guest chat must not look up users");
                            return Optional.ofNullable(user);
                        }
                        return defaultValue(method.getReturnType());
                    }
            );
        }
    }

    private static class TrackingOrderRepository {
        private final boolean failOnFind;
        private int findOrdersCalls;

        TrackingOrderRepository(boolean failOnFind) {
            this.failOnFind = failOnFind;
        }

        OrderRepository proxy() {
            return (OrderRepository) Proxy.newProxyInstance(
                    OrderRepository.class.getClassLoader(),
                    new Class<?>[]{OrderRepository.class},
                    (proxy, method, args) -> {
                        if ("findByUserIdOrderByOrderDateDesc".equals(method.getName())) {
                            findOrdersCalls++;
                            if (failOnFind) throw new AssertionError("guest chat must not look up orders");
                            return List.of();
                        }
                        return defaultValue(method.getReturnType());
                    }
            );
        }
    }

    private static class TrackingShelfBookRepository {
        private final boolean failOnFind;
        private int findStatusCalls;

        TrackingShelfBookRepository(boolean failOnFind) {
            this.failOnFind = failOnFind;
        }

        ShelfBookRepository proxy() {
            return (ShelfBookRepository) Proxy.newProxyInstance(
                    ShelfBookRepository.class.getClassLoader(),
                    new Class<?>[]{ShelfBookRepository.class},
                    (proxy, method, args) -> {
                        if ("findBookIdsByUserIdAndStatus".equals(method.getName())) {
                            findStatusCalls++;
                            if (failOnFind) throw new AssertionError("guest chat must not look up reading stats");
                            return "COMPLETED".equals(args[1]) ? List.of(1L, 2L) : List.of(3L);
                        }
                        return defaultValue(method.getReturnType());
                    }
            );
        }
    }

    private static Object defaultValue(Class<?> returnType) {
        if (returnType == boolean.class) return false;
        if (returnType == int.class || returnType == long.class || returnType == short.class || returnType == byte.class) return 0;
        if (returnType == double.class || returnType == float.class) return 0.0;
        if (returnType == Optional.class) return Optional.empty();
        if (returnType == List.class) return List.of();
        return null;
    }
}
