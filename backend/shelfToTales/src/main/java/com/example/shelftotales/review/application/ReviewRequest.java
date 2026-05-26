package com.example.shelftotales.review.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewRequest {
    @Min(1)
    @Max(5)
    private int rating;

    @NotBlank(message = "Review comment cannot be blank")
    private String comment;

    @Builder.Default
    private boolean isSpoiler = false;
}
