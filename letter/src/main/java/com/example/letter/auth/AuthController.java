package com.example.letter.auth;

import com.example.letter.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/kakao/callback")
    public ApiResponse<?> kakaoCallback(@RequestParam String code) {
        AuthService.LoginResult result = authService.kakaoLogin(code);

        return ApiResponse.ok(Map.of(
            "accessToken",  result.getAccessToken(),
            "refreshToken", result.getRefreshToken(),
            "user", Map.of(
                "id",       result.getUserId(),
                "nickname", result.getNickname(),
                "email",    result.getEmail()
            )
        ));
    }
}
