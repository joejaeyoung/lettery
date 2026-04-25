package com.example.letter.letter;

public record SendLetterResponse(
    Long id,
    String shareToken,
    String shareUrl,
    String createdAt
) {}
