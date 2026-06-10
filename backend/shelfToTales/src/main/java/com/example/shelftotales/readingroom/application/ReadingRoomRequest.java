package com.example.shelftotales.readingroom.application;
import com.example.shelftotales.readingroom.domain.*;
import com.example.shelftotales.readingroom.infrastructure.*;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReadingRoomRequest {
    @NotBlank(message = "Room name is required")
    private String name;
    private String description;
    private String bookTitle;
}
