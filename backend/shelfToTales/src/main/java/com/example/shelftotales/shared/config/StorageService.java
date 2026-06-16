package com.example.shelftotales.shared.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.UUID;

@Service
@Slf4j
public class StorageService {

    @Autowired(required = false)
    private S3Client s3Client;

    @Value("${storage.r2.bucket:shelftotales}")
    private String bucket;

    @Value("${storage.r2.public-url:}")
    private String publicUrl;

    public boolean isAvailable() {
        return s3Client != null;
    }

    public String upload(MultipartFile file, String folder) {
        if (!isAvailable()) {
            throw new IllegalStateException("Storage not configured. Set R2 credentials.");
        }
        validateFileType(file, folder);
        String ext = getExtension(file.getOriginalFilename());
        String key = folder + "/" + UUID.randomUUID() + ext;

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                    RequestBody.fromBytes(file.getBytes()));

            String url = publicUrl.isBlank() ? key : publicUrl + "/" + key;
            log.info("Uploaded file: {}", url);
            return url;
        } catch (Exception e) {
            log.error("Upload failed: {}", e.getMessage());
            throw new RuntimeException("File upload failed", e);
        }
    }

    private void validateFileType(MultipartFile file, String folder) {
        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("Filename cannot be empty");
        }
        String ext = getExtension(filename).toLowerCase();
        String contentType = file.getContentType();
        if (contentType == null) {
            contentType = "";
        }
        contentType = contentType.toLowerCase();

        if ("images".equals(folder) || "covers".equals(folder)) {
            boolean validExt = ext.equals(".jpg") || ext.equals(".jpeg") || ext.equals(".png") || ext.equals(".gif") || ext.equals(".webp");
            boolean validMime = contentType.startsWith("image/");
            if (!validExt || !validMime) {
                throw new IllegalArgumentException("Only image files are allowed (.jpg, .jpeg, .png, .gif, .webp)");
            }
        } else if ("pdfs".equals(folder)) {
            boolean validExt = ext.equals(".pdf");
            boolean validMime = "application/pdf".equals(contentType);
            if (!validExt || !validMime) {
                throw new IllegalArgumentException("Only PDF files are allowed (.pdf)");
            }
        } else if ("playlist".equals(folder) || "room-playlist".equals(folder)) {
            boolean validExt = ext.equals(".mp3") || ext.equals(".wav") || ext.equals(".ogg") || ext.equals(".m4a");
            boolean validMime = contentType.startsWith("audio/");
            if (!validExt || !validMime) {
                throw new IllegalArgumentException("Only audio files are allowed (.mp3, .wav, .ogg, .m4a)");
            }
        } else {
            throw new IllegalArgumentException("Unknown upload destination");
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }
}
