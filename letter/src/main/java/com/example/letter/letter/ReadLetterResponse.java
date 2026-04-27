package com.example.letter.letter;

public record ReadLetterResponse(
    Long id,
    TemplateDto template,
    String to,
    String body,
    String from,
    String sentAt
) {
    public record TemplateDto(String id, String name, String imageUrl) {}
}
