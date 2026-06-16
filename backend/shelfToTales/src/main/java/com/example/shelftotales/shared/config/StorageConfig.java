package com.example.shelftotales.shared.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

import java.net.URI;

@Configuration
@Slf4j
public class StorageConfig {

    @Value("${storage.r2.endpoint:}")
    private String endpoint;

    @Value("${storage.r2.access-key:}")
    private String accessKey;

    @Value("${storage.r2.secret-key:}")
    private String secretKey;

    @Value("${r2.required:true}")
    private boolean r2Required;

    @Bean
    public S3Client s3Client() {
        if (endpoint.isBlank() || accessKey.isBlank() || secretKey.isBlank()) {
            if (!r2Required) {
                log.warn("R2 not configured and r2.required=false; returning null S3Client. Uploads will fail.");
                return null;
            }
            throw new IllegalStateException(
                    "R2 storage is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY env vars.");
        }
        if (isLikelyDefault(endpoint) || isLikelyDefault(accessKey) || isLikelyDefault(secretKey)) {
            log.warn("R2 is using committed dev defaults from application.properties. Set R2_* env vars in any non-local environment.");
        }
        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.of("auto"))
                .forcePathStyle(true)
                .build();
    }

    private boolean isLikelyDefault(String s) {
        return s != null && s.length() > 16 && !s.contains("/") && !s.contains(".");
    }
}
