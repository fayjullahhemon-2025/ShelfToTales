package com.example.shelftotales.ai.application;

import com.example.shelftotales.ai.domain.SpoilerAssessment;
import com.example.shelftotales.ai.domain.SpoilerLevel;
import com.example.shelftotales.ai.domain.SpoilerSentence;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.core.ParameterizedTypeReference;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;
import reactor.netty.http.client.HttpClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.*;

@Component
@ConditionalOnProperty(name = "ai.spoiler.huggingface.enabled", havingValue = "true")
@Slf4j
public class HuggingFaceSpoilerClassifier implements SpoilerClassifier {

    @Getter
    @Value("${ai.spoiler.huggingface.enabled:false}")
    private boolean enabled;

    @Value("${ai.spoiler.huggingface.space-url}")
    private String spaceUrl;

    @Value("${ai.spoiler.huggingface.api-key:}")
    private String apiKey;

    @Value("${ai.spoiler.huggingface.timeout-ms:30000}")
    private int timeoutMs;

    @Value("${ai.spoiler.huggingface.max-retries:3}")
    private int maxRetries;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public HuggingFaceSpoilerClassifier(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.webClient = webClientBuilder
                .clone()
                .clientConnector(new ReactorClientHttpConnector(HttpClient.create()))
                .build();
    }

    @Override
    @CircuitBreaker(name = "google")
    public SpoilerAssessment classify(Long reviewId, Long userId, String text) {
        if (text == null || text.isBlank()) {
            return emptyAssessment(reviewId, userId);
        }

        try {
            return tryDirectPredict(text)
                    .onErrorResume(e -> {
                        log.warn("Direct predict failed, trying queue protocol for review {}: {}", reviewId, e.getMessage());
                        return tryQueueJoin(text);
                    })
                    .map(hfRes -> mapToAssessment(reviewId, userId, text, hfRes))
                    .timeout(Duration.ofMillis(timeoutMs))
                    .retryWhen(Retry.backoff(maxRetries, Duration.ofMillis(500)))
                    .block();
        } catch (Exception e) {
            log.warn("Hugging Face spoiler classification failed, returning SAFE fallback: {}", e.getMessage());
            return emptyAssessment(reviewId, userId);
        }
    }

    @Override
    public String modelId() {
        return "huggingface-loreguard-ai";
    }

    private Mono<HfResponse> tryDirectPredict(String text) {
        Map<String, String> body = Map.of("review_text", text);
        WebClient.RequestBodySpec spec = webClient.post()
                .uri(spaceUrl + "/api/predict?mode=api")
                .contentType(MediaType.APPLICATION_JSON);

        if (apiKey != null && !apiKey.isBlank()) {
            spec.header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey);
        }

        return spec.bodyValue(body)
                .retrieve()
                .bodyToMono(HfResponse.class);
    }

    private Mono<HfResponse> tryQueueJoin(String text) {
        String sessionHash = UUID.randomUUID().toString().substring(0, 10);
        Map<String, Object> body = Map.of(
                "data", List.of(text),
                "fn_index", 0,
                "session_hash", sessionHash
        );

        WebClient.RequestBodySpec spec = webClient.post()
                .uri(spaceUrl + "/queue/join")
                .contentType(MediaType.APPLICATION_JSON);

        if (apiKey != null && !apiKey.isBlank()) {
            spec.header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey);
        }

        return spec.bodyValue(body)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .flatMap(json -> {
                    String eventId = json.path("event_id").asText();
                    if (eventId.isEmpty()) {
                        return Mono.error(new IllegalStateException("Failed to retrieve event_id from /queue/join"));
                    }
                    return pollQueueData(sessionHash, eventId);
                });
    }

    private Mono<HfResponse> pollQueueData(String sessionHash, String eventId) {
        ParameterizedTypeReference<ServerSentEvent<String>> typeRef =
                new ParameterizedTypeReference<ServerSentEvent<String>>() {};

        return webClient.get()
                .uri(spaceUrl + "/queue/data?session_hash=" + sessionHash)
                .retrieve()
                .bodyToFlux(typeRef)
                .filter(event -> "process_completed".equals(event.event()) || 
                                 (event.data() != null && event.data().contains("process_completed")))
                .next()
                .flatMap(event -> {
                    try {
                        String data = event.data();
                        if (data == null || data.isBlank()) {
                            return Mono.error(new IllegalStateException("Empty data in process_completed event"));
                        }
                        JsonNode node = objectMapper.readTree(data);
                        JsonNode outputNode = node.path("output");
                        JsonNode dataNode = outputNode.path("data").path(0);
                        if (dataNode.isMissingNode() || dataNode.isNull()) {
                            // Try fallback to search under root data path
                            dataNode = node.path("data").path(0);
                        }
                        if (dataNode.isMissingNode() || dataNode.isNull()) {
                            return Mono.error(new IllegalStateException("Invalid data in process_completed payload"));
                        }
                        HfResponse response = objectMapper.treeToValue(dataNode, HfResponse.class);
                        return Mono.just(response);
                    } catch (Exception e) {
                        return Mono.error(e);
                    }
                });
    }

    private SpoilerAssessment mapToAssessment(Long reviewId, Long userId, String text, HfResponse response) {
        SpoilerLevel level = response.isSpoiler() ? SpoilerLevel.MAJOR_SPOILER : SpoilerLevel.SAFE;
        double score = clamp(response.getProbability());
        String sanitized = response.isSpoiler() ? "[SPOILER REDACTED]" : text;

        // Simple sentence-level splitting and mapping
        List<SpoilerSentence> sentences = new ArrayList<>();
        String[] sentenceArray = text.split("(?<=[.!?])\\s+");
        for (int i = 0; i < sentenceArray.length; i++) {
            sentences.add(new SpoilerSentence(
                    i,
                    sentenceArray[i],
                    score,
                    level
            ));
        }

        return SpoilerAssessment.builder()
                .reviewId(reviewId)
                .userId(userId)
                .spoilerLevel(level)
                .spoilerScore(BigDecimal.valueOf(round3(score)))
                .spoilerSentences(sentences)
                .sanitizedReview(sanitized)
                .model(modelId())
                .build();
    }

    private SpoilerAssessment emptyAssessment(Long reviewId, Long userId) {
        return SpoilerAssessment.builder()
                .reviewId(reviewId)
                .userId(userId)
                .spoilerLevel(SpoilerLevel.SAFE)
                .spoilerScore(BigDecimal.ZERO)
                .spoilerSentences(List.of())
                .sanitizedReview("")
                .model(modelId())
                .build();
    }

    private static double clamp(double v) {
        if (Double.isNaN(v)) return 0.0;
        if (v < 0) return 0;
        if (v > 1) return 1;
        return v;
    }

    private static double round3(double v) {
        return BigDecimal.valueOf(v).setScale(3, RoundingMode.HALF_UP).doubleValue();
    }

    @Getter
    public static class HfResponse {
        @JsonProperty("is_spoiler")
        private boolean spoiler;
        @JsonProperty("probability")
        private double probability;
        @JsonProperty("label")
        private String label;
        @JsonProperty("source")
        private String source;
    }
}
