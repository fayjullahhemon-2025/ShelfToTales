package com.example.shelftotales.auth.application;

import com.example.shelftotales.auth.domain.*;
import com.example.shelftotales.catalog.domain.*;
import com.example.shelftotales.bookshelf.domain.*;

import lombok.*;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProfileResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String email;
    private String fullName;
    private String bio;
    private String profileImageUrl;
    private String phone;
    private String address;
    private String hobbies;
    private LocalDate dateOfBirth;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
