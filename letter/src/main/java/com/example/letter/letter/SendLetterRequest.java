package com.example.letter.letter;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SendLetterRequest(
    @NotBlank String templateId,
    @NotBlank @Size(max = 20) String to,
    @NotBlank @Size(max = 2000) String body,
    @NotBlank @Size(max = 20) String from,
    List<Object> stickers
) {}
