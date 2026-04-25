package com.example.letter.auth;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtProvider {

    @Value("${culetter.jwt.secret}")
    private String secret;

    @Value("${culetter.jwt.access-expiry}")
    private long accessExpiry;

    @Value("${culetter.jwt.refresh-expiry}")
    private long refreshExpiry;

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(Long userId) {
        return buildToken(userId, accessExpiry);
    }

    public String generateRefreshToken(Long userId) {
        return buildToken(userId, refreshExpiry);
    }

    private String buildToken(Long userId, long expirySeconds) {
        return Jwts.builder()
            .subject(String.valueOf(userId))
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirySeconds * 1000))
            .signWith(signingKey())
            .compact();
    }

    public Long extractUserId(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(signingKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return Long.valueOf(claims.getSubject());
    }

    public boolean isValid(String token) {
        try {
            extractUserId(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
