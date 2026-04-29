package com.example.letter.common;

import com.example.letter.auth.InvalidRefreshTokenException;
import com.example.letter.auth.KakaoAuthException;
import com.example.letter.letter.LetterNotFoundException;
import io.jsonwebtoken.JwtException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(LetterNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<?> handleNotFound(LetterNotFoundException e) {
        return ApiResponse.fail("LETTER_NOT_FOUND", "해당 편지를 찾을 수 없습니다");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<?> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return ApiResponse.fail("VALIDATION_FAILED", message);
    }

    @ExceptionHandler(JwtException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<?> handleJwt(JwtException e) {
        return ApiResponse.fail("UNAUTHORIZED", "토큰이 유효하지 않습니다");
    }

    @ExceptionHandler(KakaoAuthException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<?> handleKakaoAuth(KakaoAuthException e) {
        return ApiResponse.fail("KAKAO_AUTH_FAILED", "카카오 로그인에 실패했습니다");
    }

    @ExceptionHandler(InvalidRefreshTokenException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<?> handleInvalidRefreshToken(InvalidRefreshTokenException e) {
        return ApiResponse.fail("INVALID_REFRESH_TOKEN", "리프레시 토큰이 유효하지 않습니다");
    }
}
