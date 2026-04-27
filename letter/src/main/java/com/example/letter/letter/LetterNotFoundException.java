package com.example.letter.letter;

public class LetterNotFoundException extends RuntimeException {
    public LetterNotFoundException() {
        super("letter not found");
    }
}
