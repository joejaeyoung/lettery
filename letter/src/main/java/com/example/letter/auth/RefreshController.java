package com.example.letter.auth;

import com.example.letter.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class RefreshController {

    private final JwtProvider jwtProvider;

    @PostMapping("/refresh")
    public ApiResponse<?> refresh(@RequestBody RefreshRequest request) {
        String refreshToken = request.refreshToken();
        if (!jwtProvider.isValid(refreshToken) || !jwtProvider.isRefreshToken(refreshToken)) {
            throw new InvalidRefreshTokenException();
        }
        Long userId = jwtProvider.extractUserId(refreshToken);
        String newAccessToken = jwtProvider.generateAccessToken(userId);
        return ApiResponse.ok(Map.of("accessToken", newAccessToken));
    }
}
