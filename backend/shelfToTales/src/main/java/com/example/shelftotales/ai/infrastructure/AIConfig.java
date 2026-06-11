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

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Configuration
@Slf4j
public class AIConfig {

    @Value("${ai.embedding.model-path:classpath:models/all-MiniLM-L6-v2.onnx}")
    private Resource modelResource;

    @Value("${ai.embedding.tokenizer-path:classpath:models/tokenizer.json}")
    private Resource tokenizerResource;

    @Bean
    public OrtEnvironment ortEnvironment() {
        try {
            return OrtEnvironment.getEnvironment();
        } catch (Exception e) {
            log.warn("Failed to create OrtEnvironment: {}", e.getMessage());
            return null;
        }
    }

    @Bean
    public OrtSession ortSession(OrtEnvironment env) {
        if (env == null) {
            log.warn("OrtEnvironment not available — semantic search will use fallback");
            return null;
        }
        try {
            Path modelPath = getResourcePath(modelResource, "all-MiniLM-L6-v2-", ".onnx");
            log.info("Loading ONNX embedding model from: {}", modelPath);
            return env.createSession(modelPath.toString());
        } catch (Exception e) {
            log.warn("ONNX model not found — semantic search will use fallback. Run: scripts/download-models.sh: {}", e.getMessage());
            return null;
        }
    }

    @Bean
    public HuggingFaceTokenizer huggingFaceTokenizer() {
        try {
            Path tokenizerPath = getResourcePath(tokenizerResource, "tokenizer-", ".json");
            return HuggingFaceTokenizer.newInstance(tokenizerPath);
        } catch (Exception e) {
            log.warn("Tokenizer not found — semantic search will use fallback: {}", e.getMessage());
            return null;
        }
    }

    private Path getResourcePath(Resource resource, String prefix, String suffix) throws IOException {
        try {
            // Try to resolve as a direct file (works in local development/IDE running from filesystem)
            return resource.getFile().toPath();
        } catch (IOException e) {
            // If it's inside a JAR (packaged application), copy the stream to a temporary file
            log.info("Extracting classpath resource {} to temporary file due to JAR execution context...", resource.getFilename());
            Path tempFile = Files.createTempFile(prefix, suffix);
            try (InputStream in = resource.getInputStream()) {
                Files.copy(in, tempFile, StandardCopyOption.REPLACE_EXISTING);
            }
            tempFile.toFile().deleteOnExit();
            return tempFile;
        }
    }
}
