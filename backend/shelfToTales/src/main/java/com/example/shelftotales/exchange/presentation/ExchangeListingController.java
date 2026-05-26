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
@RequestMapping("/api/exchange/listings")
@RequiredArgsConstructor
public class ExchangeListingController {
    private final ExchangeListingService service;

    @PostMapping
    public ResponseEntity<ExchangeListing> create(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.create(
                Long.parseLong(body.get("bookId")), body.get("type"),
                body.get("condition"), body.get("description"), body.get("location")));
    }

    @GetMapping
    public ResponseEntity<Page<ExchangeListing>> browse(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String condition,
            Pageable pageable) {
        return ResponseEntity.ok(service.browse(type, location, condition, pageable));
    }

    @GetMapping("/mine")
    public ResponseEntity<Page<ExchangeListing>> mine(Pageable pageable) {
        return ResponseEntity.ok(service.getMyListings(pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExchangeListing> update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.update(id, body.get("type"),
                body.get("condition"), body.get("description"), body.get("location")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        service.cancel(id);
        return ResponseEntity.ok().build();
    }
}
