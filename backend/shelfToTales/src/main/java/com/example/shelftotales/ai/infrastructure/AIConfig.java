package com.example.shelftotales.ai.infrastructure;
import com.example.shelftotales.ai.domain.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import ai.djl.huggingface.tokenizers.HuggingFaceTokenizer;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.nio.file.Path;

@Configuration
@Slf4j
public class AIConfig {

    @Value("${ai.embedding.model-path:classpath:models/all-MiniLM-L6-v2.onnx}")
    private Resource modelResource;

    @Value("${ai.embedding.tokenizer-path:classpath:models/tokenizer.json}")
    private Resource tokenizerResource;

    @Bean
    public OrtEnvironment ortEnvironment() {
        return OrtEnvironment.getEnvironment();
    }

    @Bean
    public OrtSession ortSession(OrtEnvironment env) {
        try {
            Path modelPath = modelResource.getFile().toPath();
            log.info("Loading ONNX embedding model from: {}", modelPath);
            return env.createSession(modelPath.toString());
        } catch (Exception e) {
            log.warn("ONNX model not found — semantic search will use fallback. Run: scripts/download-models.sh");
            return null;
        }
    }

    @Bean
    public HuggingFaceTokenizer huggingFaceTokenizer() {
        try {
            Path tokenizerPath = tokenizerResource.getFile().toPath();
            return HuggingFaceTokenizer.newInstance(tokenizerPath);
        } catch (Exception e) {
            log.warn("Tokenizer not found — semantic search will use fallback.");
            return null;
        }
    }
}
