package com.example.shelftotales.ai.application.chat;
import com.example.shelftotales.ai.domain.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.ai.application.EmbeddingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class RuleBasedChatProvider implements ChatProvider {

    private final EmbeddingService embeddingService;

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public String chat(List<ChatMessage> history, String systemPrompt) {
        String lastMessage = history.stream()
                .filter(m -> "user".equals(m.role()))
                .reduce((a, b) -> b)
                .map(ChatMessage::content)
                .orElse("");

        List<Map.Entry<Book, Double>> results = embeddingService.searchSimilar(lastMessage, 5, null);

        if (results.isEmpty()) {
            return "I couldn't find books matching that description. Could you try describing what you're looking for differently?";
        }

        StringBuilder reply = new StringBuilder("Based on what you described, here are some books you might enjoy:\n\n");
        for (int i = 0; i < results.size(); i++) {
            Book book = results.get(i).getKey();
            reply.append(i + 1).append(". **").append(book.getTitle()).append("**");
            if (book.getAuthor() != null) reply.append(" by ").append(book.getAuthor());
            reply.append("\n");
        }
        return reply.toString();
    }
}
