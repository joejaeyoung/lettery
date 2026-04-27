package com.example.letter.letter;

import com.example.letter.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/letters")
@RequiredArgsConstructor
public class LetterController {

    private final LetterService letterService;

    @PostMapping
    public ApiResponse<SendLetterResponse> send(
        @AuthenticationPrincipal Long userId,
        @Valid @RequestBody SendLetterRequest req
    ) {
        return ApiResponse.ok(letterService.send(userId, req));
    }

    @GetMapping("/share/{shareToken}")
    public ApiResponse<ReadLetterResponse> read(@PathVariable String shareToken) {
        return ApiResponse.ok(letterService.read(shareToken));
    }
}
