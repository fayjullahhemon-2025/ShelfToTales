package com.example.shelftotales.ai.infrastructure;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.io.ByteArrayInputStream;
import java.io.IOException;

@Service
@Slf4j
public class PdfExtractionService {

    private final S3Client s3Client;

    public PdfExtractionService(@org.springframework.beans.factory.annotation.Autowired(required = false) S3Client s3Client) {
        this.s3Client = s3Client;
    }

    @Value("${storage.r2.bucket:shelftotales}")
    private String bucket;

    @Value("${storage.r2.public-url:}")
    private String publicUrl;

    /**
     * Download PDF from R2 by object key and extract all text.
     *
     * @param r2ObjectKey the key in the R2 bucket (e.g., "pdfs/abc.pdf")
     * @return extracted text content
     * @throws IOException if download or extraction fails
     */
    public String extractText(String r2ObjectKey) throws IOException {
        log.info("Downloading PDF from R2: bucket={}, key={}", bucket, r2ObjectKey);

        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(r2ObjectKey)
                .build();

        try (ResponseInputStream<GetObjectResponse> response = s3Client.getObject(getRequest);
             PDDocument document = Loader.loadPDF(response.readAllBytes())) {

            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);

            log.info("Extracted {} characters from PDF: {}", text.length(), r2ObjectKey);
            return text;

        } catch (IOException e) {
            log.error("Failed to extract text from PDF: {}", r2ObjectKey, e);
            throw e;
        }
    }

    /**
     * Extract text from PDF bytes directly (for when PDF is already in memory).
     */
    public String extractTextFromBytes(byte[] pdfBytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    /**
     * Get the public URL for a book's PDF.
     */
    public String getPdfUrl(String r2ObjectKey) {
        if (publicUrl == null || publicUrl.isBlank()) {
            return null;
        }
        return publicUrl + "/" + r2ObjectKey;
    }
}
