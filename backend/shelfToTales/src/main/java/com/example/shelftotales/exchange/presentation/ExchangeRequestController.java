package com.example.shelftotales.exchange.presentation;
import com.example.shelftotales.exchange.domain.*;
import com.example.shelftotales.exchange.application.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/exchange")
@RequiredArgsConstructor
public class ExchangeRequestController {
    private final ExchangeRequestService requestService;
    private final ExchangeRatingService ratingService;

    @PostMapping("/listings/{listingId}/request")
    public ResponseEntity<ExchangeRequest> sendRequest(
            @PathVariable Long listingId, @RequestBody(required = false) Map<String, Object> body) {
        String message = body != null ? (String) body.get("message") : null;
        Long offeredBookId = body != null && body.get("offeredBookId") != null
                ? Long.parseLong(body.get("offeredBookId").toString()) : null;
        return ResponseEntity.ok(requestService.sendRequest(listingId, message, offeredBookId));
    }

    @GetMapping("/requests/incoming")
    public ResponseEntity<Page<ExchangeRequest>> incoming(Pageable pageable) {
        return ResponseEntity.ok(requestService.getIncoming(pageable));
    }

    @GetMapping("/requests/outgoing")
    public ResponseEntity<Page<ExchangeRequest>> outgoing(Pageable pageable) {
        return ResponseEntity.ok(requestService.getOutgoing(pageable));
    }

    @PutMapping("/requests/{id}/accept")
    public ResponseEntity<Void> accept(@PathVariable Long id) {
        requestService.accept(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/requests/{id}/reject")
    public ResponseEntity<Void> reject(@PathVariable Long id) {
        requestService.reject(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/requests/{id}/complete")
    public ResponseEntity<Void> complete(@PathVariable Long id) {
        requestService.complete(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/requests/{id}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        requestService.cancel(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/requests/{id}/rate")
    public ResponseEntity<?> rate(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        int score = Integer.parseInt(body.get("score").toString());
        String comment = (String) body.get("comment");
        return ResponseEntity.ok(ratingService.rate(id, score, comment));
    }

    @GetMapping("/ratings/{userId}")
    public ResponseEntity<Map<String, Object>> trustProfile(@PathVariable Long userId) {
        Double trustScore = ratingService.getTrustScore(userId);
        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "trustScore", trustScore != null ? trustScore : 0.0,
                "ratings", ratingService.getRatings(userId)));
    }
}
