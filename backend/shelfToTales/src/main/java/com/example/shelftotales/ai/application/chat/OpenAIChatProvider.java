package com.example.shelftotales.ai.application.chat;
import com.example.shelftotales.ai.domain.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Component
@Slf4j
public class OpenAIChatProvider implements ChatProvider {

    @Value("${ai.chat.provider:none}")
    private String provider;

    @Value("${ai.chat.api-key:}")
    private String apiKey;

    @Value("${ai.chat.model:meta-llama/llama-3.1-8b-instruct:free}")
    private String model;

    @Value("${ai.chat.base-url:https://openrouter.ai/api/v1/chat/completions}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public boolean isAvailable() {
        if ("openai".equals(provider)) {
            return apiKey != null && !apiKey.isBlank();
        }
        if ("openrouter".equals(provider)) {
            return true;
        }
        return false;
    }

    @Override
    @SuppressWarnings("unchecked")
    public String chat(List<ChatMessage> history, String systemPrompt) {
        if (!isAvailable()) return null;
        try {
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            messages.addAll(history.stream()
                    .map(m -> Map.of("role", m.role(), "content", m.content()))
                    .collect(Collectors.toList()));

            Map<String, Object> body = Map.of(
                    "model", model, "messages", messages,
                    "max_tokens", 300, "temperature", 0.7);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (apiKey != null && !apiKey.isBlank()) {
                headers.setBearerAuth(apiKey);
            }

            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);

            Map responseBody = response.getBody();
            if (responseBody != null) {
                List<Map> choices = (List<Map>) responseBody.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map message = (Map) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
            return null;
        } catch (Exception e) {
            log.error("OpenAI API call failed: {}", e.getMessage());
            return null;
        }
    }
}
