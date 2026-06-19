package com.example.shelftotales.catalog.infrastructure;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.Base64;

@Service
public class ImageHashService {

    private static final int HASH_SIZE = 8;

    public long computeDHash(MultipartFile file) throws IOException {
        BufferedImage image = ImageIO.read(file.getInputStream());
        if (image == null) {
            throw new IOException("Unable to read image file");
        }
        return computeDHash(image);
    }

    public long computeDHash(URL imageUrl) throws IOException {
        try (InputStream in = imageUrl.openStream()) {
            BufferedImage image = ImageIO.read(in);
            if (image == null) {
                throw new IOException("Unable to read image from URL: " + imageUrl);
            }
            return computeDHash(image);
        }
    }

    /**
     * Decode a base64 string (with or without data-URL prefix) and compute its dHash.
     */
    public long computeDHashFromBase64(String base64) {
        if (base64 == null || base64.isBlank()) {
            throw new IllegalArgumentException("base64 payload is empty");
        }
        String payload = base64;
        int comma = payload.indexOf(',');
        if (payload.startsWith("data:") && comma >= 0) {
            payload = payload.substring(comma + 1);
        }
        byte[] bytes = Base64.getDecoder().decode(payload);
        try (InputStream in = new ByteArrayInputStream(bytes)) {
            BufferedImage image = ImageIO.read(in);
            if (image == null) {
                throw new IOException("Unable to read image from base64 payload");
            }
            return computeDHash(image);
        } catch (IOException e) {
            throw new RuntimeException("Failed to decode image from base64: " + e.getMessage(), e);
        }
    }

    public long computeDHash(BufferedImage image) {
        BufferedImage resized = new BufferedImage(HASH_SIZE + 1, HASH_SIZE, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = resized.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(image, 0, 0, HASH_SIZE + 1, HASH_SIZE, null);
        g.dispose();

        long hash = 0;
        for (int y = 0; y < HASH_SIZE; y++) {
            for (int x = 0; x < HASH_SIZE; x++) {
                int rgb1 = resized.getRGB(x, y);
                int rgb2 = resized.getRGB(x + 1, y);
                int gray1 = ((rgb1 >> 16) & 0xff) * 299 + ((rgb1 >> 8) & 0xff) * 587 + (rgb1 & 0xff) * 114;
                int gray2 = ((rgb2 >> 16) & 0xff) * 299 + ((rgb2 >> 8) & 0xff) * 587 + (rgb2 & 0xff) * 114;
                if (gray1 < gray2) {
                    hash |= (1L << (y * HASH_SIZE + x));
                }
            }
        }
        return hash;
    }

    public int hammingDistance(long hash1, long hash2) {
        return Long.bitCount(hash1 ^ hash2);
    }
}
