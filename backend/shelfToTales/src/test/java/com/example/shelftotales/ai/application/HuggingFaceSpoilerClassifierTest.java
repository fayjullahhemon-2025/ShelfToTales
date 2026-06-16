package com.example.shelftotales.ai.application;

import com.example.shelftotales.ai.domain.SpoilerAssessment;
import com.example.shelftotales.ai.domain.SpoilerLevel;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class HuggingFaceSpoilerClassifierTest {

    private MockWebServer mockWebServer;
    private HuggingFaceSpoilerClassifier classifier;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        objectMapper = new ObjectMapper();
        WebClient.Builder builder = WebClient.builder();
        classifier = new HuggingFaceSpoilerClassifier(builder, objectMapper);

        ReflectionTestUtils.setField(classifier, "enabled", true);
        ReflectionTestUtils.setField(classifier, "spaceUrl", mockWebServer.url("/").toString().replaceAll("/$", ""));
        ReflectionTestUtils.setField(classifier, "timeoutMs", 5000);
        ReflectionTestUtils.setField(classifier, "maxRetries", 1);
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    @Test
    void classifyDirectSuccess() throws Exception {
        String responseJson = "{\"is_spoiler\":true,\"probability\":0.85,\"label\":\"spoiler\",\"source\":\"API\"}";
        mockWebServer.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody(responseJson));

        SpoilerAssessment assessment = classifier.classify(1L, 10L, "spoiler alert!");

        assertNotNull(assessment);
        assertEquals(SpoilerLevel.MAJOR_SPOILER, assessment.getSpoilerLevel());
        assertEquals(BigDecimal.valueOf(0.85), assessment.getSpoilerScore());
        assertEquals("huggingface-loreguard-ai", assessment.getModel());
    }

    @Test
    void classifyFallbackToQueueSuccess() throws Exception {
        // 1. Direct Predict fails with 503 (or queue warning)
        mockWebServer.enqueue(new MockResponse().setResponseCode(503));

        // 2. Queue join succeeds returning event_id
        mockWebServer.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody("{\"event_id\":\"test-event-id\"}"));

        // 3. Queue data stream returns process_completed
        String sseEvent = "event: process_completed\ndata: {\"output\":{\"data\":[{\"is_spoiler\":false,\"probability\":0.15,\"label\":\"safe\",\"source\":\"Queue\"}]}}\n\n";
        mockWebServer.enqueue(new MockResponse()
                .setHeader("Content-Type", "text/event-stream")
                .setBody(sseEvent));

        SpoilerAssessment assessment = classifier.classify(1L, 10L, "safe review text");

        assertNotNull(assessment);
        assertEquals(SpoilerLevel.SAFE, assessment.getSpoilerLevel());
        assertEquals(BigDecimal.valueOf(0.15), assessment.getSpoilerScore());
    }

    @Test
    void classifyFailReturnsSafePlaceholder() {
        mockWebServer.enqueue(new MockResponse().setResponseCode(500));
        // Queue fallback fails too
        mockWebServer.enqueue(new MockResponse().setResponseCode(500));

        SpoilerAssessment assessment = classifier.classify(1L, 10L, "broken context");

        assertNotNull(assessment);
        assertEquals(SpoilerLevel.SAFE, assessment.getSpoilerLevel());
        assertEquals(BigDecimal.ZERO, assessment.getSpoilerScore());
    }
}
