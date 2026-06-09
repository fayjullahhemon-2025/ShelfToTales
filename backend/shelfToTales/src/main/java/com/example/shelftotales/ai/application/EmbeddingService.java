package com.example.shelftotales.ai.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import ai.djl.huggingface.tokenizers.Encoding;
import ai.djl.huggingface.tokenizers.HuggingFaceTokenizer;
import ai.onnxruntime.*;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.domain.BookEmbedding;
import com.example.shelftotales.catalog.infrastructure.BookEmbeddingRepository;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmbeddingService {

    private static final int DIMENSIONS = 384;
    private static final int MAX_TOKENS = 128;

    @Nullable private final OrtEnvironment ortEnvironment;
    @Nullable private final OrtSession ortSession;
    @Nullable private final HuggingFaceTokenizer tokenizer;
    private final BookEmbeddingRepository embeddingRepository;
    private final BookRepository bookRepository;
    private final AIService aiService;
    private final JdbcTemplate jdbcTemplate;

    private boolean isPgVectorAvailable = false;

    public boolean isModelAvailable() {
        return ortSession != null && tokenizer != null;
    }

    @PostConstruct
    public void init() {
        try {
            Boolean hasVector = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')", 
                Boolean.class
            );
            this.isPgVectorAvailable = Boolean.TRUE.equals(hasVector);
        } catch (Exception e) {
            this.isPgVectorAvailable = false;
        }
    }

    public boolean isPgVectorAvailable() {
        return isPgVectorAvailable;
    }

    public List<Long> getSimilarBookIdsExcluding(double[] vector, Long excludeBookId, int limit) {
        if (vector == null || vector.length == 0) return Collections.emptyList();
        String vectorStr = aiService.vectorToString(vector);
        if (isPgVectorAvailable) {
            String pgvectorStr = "[" + vectorStr + "]";
            return embeddingRepository.findSimilarBookIdsExcludingPgVector(excludeBookId, pgvectorStr, limit);
        } else {
            return embeddingRepository.findSimilarBookIdsExcludingFallback(excludeBookId, vectorStr, limit);
        }
    }

    public List<Long> getSimilarBookIds(double[] vector, int limit) {
        if (vector == null || vector.length == 0) return Collections.emptyList();
        String vectorStr = aiService.vectorToString(vector);
        if (isPgVectorAvailable) {
            String pgvectorStr = "[" + vectorStr + "]";
            return embeddingRepository.findSimilarBookIdsPgVector(pgvectorStr, limit);
        } else {
            return embeddingRepository.findSimilarBookIdsFallback(vectorStr, limit);
        }
    }

    public double[] generateEmbedding(String text) {
        if (!isModelAvailable()) {
            return aiService.generateEmbedding(text);
        }
        try {
            Encoding encoding = tokenizer.encode(text != null ? text : "");
            long[] inputIds = encoding.getIds();
            long[] attentionMask = encoding.getAttentionMask();

            if (inputIds.length > MAX_TOKENS) {
                inputIds = Arrays.copyOf(inputIds, MAX_TOKENS);
                attentionMask = Arrays.copyOf(attentionMask, MAX_TOKENS);
            }

            long[][] inputIdsBatch = {inputIds};
            long[][] attentionMaskBatch = {attentionMask};
            long[][] tokenTypeIds = {new long[inputIds.length]};

            Map<String, OnnxTensor> inputs = new HashMap<>();
            inputs.put("input_ids", OnnxTensor.createTensor(ortEnvironment, inputIdsBatch));
            inputs.put("attention_mask", OnnxTensor.createTensor(ortEnvironment, attentionMaskBatch));
            inputs.put("token_type_ids", OnnxTensor.createTensor(ortEnvironment, tokenTypeIds));

            OrtSession.Result result = ortSession.run(inputs);
            float[][][] output = (float[][][]) result.get(0).getValue();
            double[] embedding = meanPool(output[0], attentionMask);

            // Normalize
            double norm = 0;
            for (double v : embedding) norm += v * v;
            norm = Math.sqrt(norm);
            if (norm > 0) for (int i = 0; i < embedding.length; i++) embedding[i] /= norm;

            inputs.values().forEach(OnnxTensor::close);
            result.close();
            return embedding;
        } catch (Exception e) {
            log.error("ONNX inference failed, using fallback: {}", e.getMessage());
            return aiService.generateEmbedding(text);
        }
    }

    @Transactional(readOnly = true)
    public List<Map.Entry<Book, Double>> searchSimilar(String query, int limit, Long excludeUserId) {
        double[] queryVec = generateEmbedding(query);
        List<Long> similarIds = getSimilarBookIds(queryVec, limit);
        if (similarIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<BookEmbedding> embeddings = embeddingRepository.findAllById(similarIds);
        Map<Long, BookEmbedding> embeddingMap = embeddings.stream()
                .collect(Collectors.toMap(BookEmbedding::getBookId, e -> e));

        return similarIds.stream()
                .map(embeddingMap::get)
                .filter(Objects::nonNull)
                .map(emb -> Map.entry(emb.getBook(),
                        aiService.calculateSimilarity(queryVec, aiService.stringToVector(emb.getVectorData()))))
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void embedBook(Book book) {
        String text = buildBookText(book);
        double[] vector = generateEmbedding(text);
        BookEmbedding embedding = embeddingRepository.findById(book.getId())
                .orElse(BookEmbedding.builder().book(book).build());
        embedding.setVectorData(aiService.vectorToString(vector));
        embeddingRepository.saveAndFlush(embedding);

        if (isPgVectorAvailable) {
            String pgvectorStr = "[" + aiService.vectorToString(vector) + "]";
            jdbcTemplate.update(
                "UPDATE book_embeddings SET embedding = CAST(? AS vector) WHERE book_id = ?",
                pgvectorStr,
                book.getId()
            );
        }
    }

    @Transactional
    public int reindexAll() {
        List<Book> books = bookRepository.findAll();
        for (Book book : books) embedBook(book);
        log.info("Reindexed {} book embeddings", books.size());
        return books.size();
    }

    private String buildBookText(Book book) {
        StringBuilder sb = new StringBuilder(book.getTitle());
        if (book.getAuthor() != null) sb.append(" by ").append(book.getAuthor());
        if (book.getDescription() != null) sb.append(". ").append(book.getDescription());
        if (book.getCategory() != null) sb.append(". Genre: ").append(book.getCategory().getName());
        if (book.getMoodTags() != null) sb.append(". Mood: ").append(book.getMoodTags());
        return sb.toString();
    }

    private double[] meanPool(float[][] tokenEmbeddings, long[] attentionMask) {
        double[] pooled = new double[DIMENSIONS];
        int seqLen = Math.min(tokenEmbeddings.length, attentionMask.length);
        int validTokens = 0;
        for (int i = 0; i < seqLen; i++) {
            if (attentionMask[i] == 1) {
                for (int j = 0; j < DIMENSIONS && j < tokenEmbeddings[i].length; j++)
                    pooled[j] += tokenEmbeddings[i][j];
                validTokens++;
            }
        }
        if (validTokens > 0) for (int j = 0; j < DIMENSIONS; j++) pooled[j] /= validTokens;
        return pooled;
    }
}
