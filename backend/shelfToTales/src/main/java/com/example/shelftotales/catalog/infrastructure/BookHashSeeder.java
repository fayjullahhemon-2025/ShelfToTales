package com.example.shelftotales.catalog.infrastructure;

import com.example.shelftotales.catalog.domain.Book;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookHashSeeder implements CommandLineRunner {

    private final BookRepository bookRepository;
    private final ImageHashService imageHashService;

    @Override
    public void run(String... args) {
        log.info("Starting BookHashSeeder - checking for books without cover hashes...");

        var booksNeedingHash = bookRepository.findAll().stream()
                .filter(book -> book.getCoverHash() == null && book.getCoverUrl() != null && !book.getCoverUrl().isEmpty())
                .toList();

        if (booksNeedingHash.isEmpty()) {
            log.info("No books need hash computation.");
            return;
        }

        log.info("Computing hashes for {} books...", booksNeedingHash.size());

        int success = 0;
        int failed = 0;

        for (Book book : booksNeedingHash) {
            try {
                var resource = new UrlResource(book.getCoverUrl());
                File tempFile = File.createTempFile("hash_", ".jpg");
                resource.downloadTo(tempFile.toPath());

                var multipartFile = new org.springframework.mock.web.MockMultipartFile(
                        "file", "cover.jpg", "image/jpeg",
                        Files.newInputStream(tempFile.toPath()));

                long hash = imageHashService.computeDHash(multipartFile);
                book.setCoverHash(hash);
                bookRepository.save(book);
                success++;

                tempFile.delete();
            } catch (Exception e) {
                failed++;
                log.warn("Failed to hash book {}: {}", book.getId(), e.getMessage());
            }
        }

        log.info("BookHashSeeder complete: {} succeeded, {} failed", success, failed);
    }
}
