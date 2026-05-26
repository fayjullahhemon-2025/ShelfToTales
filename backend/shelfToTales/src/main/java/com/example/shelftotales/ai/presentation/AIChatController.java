package com.example.shelftotales.ai.presentation;
import com.example.shelftotales.ai.application.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import com.example.shelftotales.ai.application.ChatRequest;
import com.example.shelftotales.ai.application.ChatResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/chat")
@RequiredArgsConstructor
public class AIChatController {
    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        return ResponseEntity.ok(chatService.chat(request.getMessage()));
    }

    @DeleteMapping
    public ResponseEntity<Void> clearSession() {
        chatService.clearSession();
        return ResponseEntity.ok().build();
    }
}
