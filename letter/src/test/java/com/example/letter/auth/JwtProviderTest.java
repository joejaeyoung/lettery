package com.example.letter.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class JwtProviderTest {

    @Autowired
    JwtProvider jwtProvider;

    @Test
    void accessToken_생성후_userId_추출_성공() {
        String token = jwtProvider.generateAccessToken(42L);
        assertThat(jwtProvider.isValid(token)).isTrue();
        assertThat(jwtProvider.extractUserId(token)).isEqualTo(42L);
    }

    @Test
    void 잘못된_토큰은_invalid() {
        assertThat(jwtProvider.isValid("invalid.token.here")).isFalse();
    }

    @Test
    void refreshToken_생성후_userId_추출_성공() {
        String token = jwtProvider.generateRefreshToken(99L);
        assertThat(jwtProvider.isValid(token)).isTrue();
        assertThat(jwtProvider.extractUserId(token)).isEqualTo(99L);
    }

    @Test
    void accessToken은_isRefreshToken이_false() {
        String token = jwtProvider.generateAccessToken(1L);
        assertThat(jwtProvider.isRefreshToken(token)).isFalse();
    }

    @Test
    void refreshToken은_isRefreshToken이_true() {
        String token = jwtProvider.generateRefreshToken(1L);
        assertThat(jwtProvider.isRefreshToken(token)).isTrue();
    }
}
