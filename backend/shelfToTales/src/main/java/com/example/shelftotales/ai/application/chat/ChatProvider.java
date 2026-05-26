package com.example.shelftotales.ai.application.chat;
import com.example.shelftotales.ai.domain.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import java.util.List;

public interface ChatProvider {
    String chat(List<ChatMessage> history, String systemPrompt);
    boolean isAvailable();
}
