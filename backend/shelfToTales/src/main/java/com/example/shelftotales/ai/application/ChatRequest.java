package com.example.shelftotales.ai.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ChatRequest {
    private String message;
}
