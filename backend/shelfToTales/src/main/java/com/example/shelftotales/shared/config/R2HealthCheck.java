package com.example.shelftotales.shared.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class R2HealthCheck implements ApplicationListener<ApplicationEnvironmentPreparedEvent> {

    @Override
    public void onApplicationEvent(ApplicationEnvironmentPreparedEvent event) {
        ConfigurableEnvironment env = event.getEnvironment();
        if (env.getProperty("r2.required", Boolean.class, Boolean.TRUE) == Boolean.FALSE) {
            log.warn("R2 required check disabled (r2.required=false). Uploads will fail at runtime.");
            return;
        }
        String endpoint = env.getProperty("storage.r2.endpoint", "");
        String accessKey = env.getProperty("storage.r2.access-key", "");
        String secretKey = env.getProperty("storage.r2.secret-key", "");
        String publicUrl = env.getProperty("storage.r2.public-url", "");
        String bucket = env.getProperty("storage.r2.bucket", "");

        if (endpoint.isBlank() || accessKey.isBlank() || secretKey.isBlank()) {
            throw new IllegalStateException(
                    "R2 storage is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY env vars "
                            + "(plus R2_BUCKET and R2_PUBLIC_URL for uploads and public URL serving).");
        }

        if (bucket.isBlank() || publicUrl.isBlank()) {
            log.warn("R2_BUCKET or R2_PUBLIC_URL is blank; uploads may fail or return broken URLs.");
        }
    }
}
