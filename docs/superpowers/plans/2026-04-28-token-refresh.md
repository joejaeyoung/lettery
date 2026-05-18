# JWT 토큰 재발급 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** refresh token으로 만료된 access token을 자동 갱신하고, 실패한 API 요청을 사용자 개입 없이 재시도한다.

**Architecture:** 백엔드는 JWT에 `type` claim을 추가해 access/refresh 토큰을 구분하고, `POST /v1/auth/refresh` 엔드포인트로 새 access token을 발급한다. 프론트엔드 `client.ts`는 401 응답 시 refresh를 시도하고 성공하면 원래 요청을 재시도하며, refresh도 실패하면 `/login`으로 이동한다. `Write.tsx`는 토큰 없을 때 요청 전 먼저 로그인 모달을 띄워 draft를 보존한다.

**Tech Stack:** Spring Boot 4.0.6, JJWT 0.12.3, React 18 + TypeScript

---

## 파일 구조

| 파일 | 역할 |
|------|------|
| `letter/src/main/java/com/example/letter/auth/JwtProvider.java` | type claim 추가, isRefreshToken() 신규 |
| `letter/src/main/java/com/example/letter/config/JwtAuthFilter.java` | refresh token으로 API 인증 차단 |
| `letter/src/main/java/com/example/letter/auth/InvalidRefreshTokenException.java` | 신규 예외 |
| `letter/src/main/java/com/example/letter/auth/RefreshRequest.java` | 신규 record |
| `letter/src/main/java/com/example/letter/auth/RefreshController.java` | POST /v1/auth/refresh |
| `letter/src/main/java/com/example/letter/common/GlobalExceptionHandler.java` | InvalidRefreshTokenException → 401 |
| `letter/src/test/java/com/example/letter/auth/JwtProviderTest.java` | type claim 테스트 추가 |
| `letter/src/test/java/com/example/letter/auth/RefreshControllerTest.java` | 신규 통합 테스트 |
| `culetter-react/src/api/client.ts` | refreshAccessToken(), 401 retry |
| `culetter-react/src/pages/Write.tsx` | 토큰 없을 때 요청 전 모달 표시 |

---

## Task 1: JwtProvider — type claim 추가

**Files:**
- Modify: `letter/src/main/java/com/example/letter/auth/JwtProvider.java`
- Modify: `letter/src/test/java/com/example/letter/auth/JwtProviderTest.java`

- [ ] **Step 1: JwtProviderTest에 실패하는 테스트 추가**

```java
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
```

- [ ] **Step 2: 테스트 실행 — 컴파일 에러 확인**

```bash
cd letter && ./gradlew test --tests "com.example.letter.auth.JwtProviderTest" 2>&1 | tail -10
```
Expected: FAIL (isRefreshToken 메서드 없음)

- [ ] **Step 3: JwtProvider 수정 — buildToken에 type claim 추가, isRefreshToken() 신규**

`letter/src/main/java/com/example/letter/auth/JwtProvider.java` 전체 교체:

```java
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
        return buildToken(userId, accessExpiry, "access");
    }

    public String generateRefreshToken(Long userId) {
        return buildToken(userId, refreshExpiry, "refresh");
    }

    private String buildToken(Long userId, long expirySeconds, String type) {
        return Jwts.builder()
            .subject(String.valueOf(userId))
            .claim("type", type)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirySeconds * 1000))
            .signWith(signingKey())
            .compact();
    }

    public Long extractUserId(String token) {
        return Long.valueOf(parseClaims(token).getSubject());
    }

    public boolean isRefreshToken(String token) {
        try {
            return "refresh".equals(parseClaims(token).get("type", String.class));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
```

- [ ] **Step 4: 테스트 실행 — 전체 통과 확인**

```bash
./gradlew test --tests "com.example.letter.auth.JwtProviderTest" 2>&1 | tail -5
```
Expected: BUILD SUCCESSFUL (5개 테스트 통과)

- [ ] **Step 5: 커밋**

```bash
git add letter/src/main/java/com/example/letter/auth/JwtProvider.java \
        letter/src/test/java/com/example/letter/auth/JwtProviderTest.java
git commit -m "feat: add type claim to JWT, add isRefreshToken()"
```

---

## Task 2: JwtAuthFilter — refresh token으로 API 인증 차단

**Files:**
- Modify: `letter/src/main/java/com/example/letter/config/JwtAuthFilter.java`

- [ ] **Step 1: 기존 LetterControllerTest 실행 — 현재 통과 확인**

```bash
./gradlew test --tests "com.example.letter.letter.LetterControllerTest" 2>&1 | tail -5
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 2: JwtAuthFilter 수정**

`doFilterInternal` 내부의 조건 한 줄만 변경:

```java
// 기존
if (jwtProvider.isValid(token)) {

// 변경
if (jwtProvider.isValid(token) && !jwtProvider.isRefreshToken(token)) {
```

`letter/src/main/java/com/example/letter/config/JwtAuthFilter.java` 전체:

```java
package com.example.letter.config;

import com.example.letter.auth.JwtProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtProvider.isValid(token) && !jwtProvider.isRefreshToken(token)) {
                Long userId = jwtProvider.extractUserId(token);
                UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        chain.doFilter(request, response);
    }
}
```

- [ ] **Step 3: 테스트 실행 — 기존 테스트 모두 통과 확인**

```bash
./gradlew test 2>&1 | tail -5
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: 커밋**

```bash
git add letter/src/main/java/com/example/letter/config/JwtAuthFilter.java
git commit -m "feat: reject refresh tokens in JwtAuthFilter"
```

---

## Task 3: InvalidRefreshTokenException + GlobalExceptionHandler

**Files:**
- Create: `letter/src/main/java/com/example/letter/auth/InvalidRefreshTokenException.java`
- Modify: `letter/src/main/java/com/example/letter/common/GlobalExceptionHandler.java`

- [ ] **Step 1: InvalidRefreshTokenException 생성**

```java
package com.example.letter.auth;

public class InvalidRefreshTokenException extends RuntimeException {
    public InvalidRefreshTokenException() {
        super("Invalid or expired refresh token");
    }
}
```

- [ ] **Step 2: GlobalExceptionHandler에 핸들러 추가**

기존 import 아래에 추가:
```java
import com.example.letter.auth.InvalidRefreshTokenException;
```

핸들러 메서드 추가 (기존 `handleKakaoAuth` 아래):
```java
@ExceptionHandler(InvalidRefreshTokenException.class)
@ResponseStatus(HttpStatus.UNAUTHORIZED)
public ApiResponse<?> handleInvalidRefreshToken(InvalidRefreshTokenException e) {
    return ApiResponse.fail("INVALID_REFRESH_TOKEN", "리프레시 토큰이 유효하지 않습니다");
}
```

- [ ] **Step 3: 테스트 실행 — 기존 테스트 모두 통과 확인**

```bash
./gradlew test 2>&1 | tail -5
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: 커밋**

```bash
git add letter/src/main/java/com/example/letter/auth/InvalidRefreshTokenException.java \
        letter/src/main/java/com/example/letter/common/GlobalExceptionHandler.java
git commit -m "feat: add InvalidRefreshTokenException and handler"
```

---

## Task 4: RefreshController

**Files:**
- Create: `letter/src/main/java/com/example/letter/auth/RefreshRequest.java`
- Create: `letter/src/main/java/com/example/letter/auth/RefreshController.java`
- Create: `letter/src/test/java/com/example/letter/auth/RefreshControllerTest.java`

- [ ] **Step 1: RefreshControllerTest 작성 (실패하는 테스트)**

```java
package com.example.letter.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class RefreshControllerTest {

    @Autowired MockMvc mvc;
    @Autowired JwtProvider jwtProvider;
    @MockitoBean KakaoAuthClient kakaoAuthClient;

    @Test
    void 유효한_refreshToken으로_새_accessToken_발급() throws Exception {
        String refreshToken = jwtProvider.generateRefreshToken(1L);

        mvc.perform(post("/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.ok").value(true))
            .andExpect(jsonPath("$.data.accessToken").isNotEmpty());
    }

    @Test
    void accessToken을_refreshToken으로_사용시_401() throws Exception {
        String accessToken = jwtProvider.generateAccessToken(1L);

        mvc.perform(post("/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"" + accessToken + "\"}"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.ok").value(false))
            .andExpect(jsonPath("$.error.code").value("INVALID_REFRESH_TOKEN"));
    }

    @Test
    void 잘못된_토큰으로_refresh_401() throws Exception {
        mvc.perform(post("/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"invalid.token.here\"}"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("INVALID_REFRESH_TOKEN"));
    }
}
```

- [ ] **Step 2: 테스트 실행 — 컴파일 에러 확인**

```bash
./gradlew test --tests "com.example.letter.auth.RefreshControllerTest" 2>&1 | tail -10
```
Expected: FAIL (RefreshController, RefreshRequest 없음)

- [ ] **Step 3: RefreshRequest record 생성**

```java
package com.example.letter.auth;

public record RefreshRequest(String refreshToken) {}
```

- [ ] **Step 4: RefreshController 생성**

```java
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
```

- [ ] **Step 5: 테스트 실행 — 3개 모두 통과 확인**

```bash
./gradlew test --tests "com.example.letter.auth.RefreshControllerTest" 2>&1 | tail -5
```
Expected: BUILD SUCCESSFUL (3개 통과)

- [ ] **Step 6: 전체 테스트 확인**

```bash
./gradlew test 2>&1 | tail -5
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 7: 커밋**

```bash
git add letter/src/main/java/com/example/letter/auth/RefreshRequest.java \
        letter/src/main/java/com/example/letter/auth/RefreshController.java \
        letter/src/test/java/com/example/letter/auth/RefreshControllerTest.java
git commit -m "feat: add POST /v1/auth/refresh endpoint"
```

---

## Task 5: client.ts — 401 자동 refresh + retry

**Files:**
- Modify: `culetter-react/src/api/client.ts`

- [ ] **Step 1: client.ts 전체 교체**

`culetter-react/src/api/client.ts`:

```typescript
const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080/v1'

let refreshPromise: Promise<string> | null = null

function getToken(): string | null {
  return localStorage.getItem('culetter_access_token')
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('culetter_refresh_token')
  if (!refreshToken) throw new Error('NO_REFRESH_TOKEN')

  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.ok) throw new Error('REFRESH_FAILED')

  const newToken: string = json.data.accessToken
  localStorage.setItem('culetter_access_token', newToken)
  return newToken
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers })

  if (res.status === 401) {
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null })
      }
      const newToken = await refreshPromise
      const retryRes = await fetch(`${BASE}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${newToken}` },
      })
      if (!retryRes.ok) {
        const errJson = await retryRes.json().catch(() => null)
        throw new Error(errJson?.error?.code ?? `HTTP_${retryRes.status}`)
      }
      const retryJson = await retryRes.json()
      if (!retryJson.ok) throw new Error(retryJson.error?.code ?? 'UNKNOWN_ERROR')
      return retryJson.data as T
    } catch {
      localStorage.removeItem('culetter_access_token')
      localStorage.removeItem('culetter_refresh_token')
      localStorage.removeItem('culetter_user')
      window.location.href = '/login'
      throw new Error('SESSION_EXPIRED')
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error?.code ?? `HTTP_${res.status}`)
  }
  const json = await res.json()
  if (!json.ok) throw new Error(json.error?.code ?? 'UNKNOWN_ERROR')
  return json.data as T
}

export type UserDto = { id: number; nickname: string; email: string }
export type LoginData = { accessToken: string; refreshToken: string; user: UserDto }
export type SendLetterData = { id: number; shareToken: string; shareUrl: string; createdAt: string }
export type LetterData = {
  id: number
  template: { id: string; name: string; imageUrl: string }
  to: string
  body: string
  from: string
  sentAt: string
}

export const api = {
  kakaoLogin: (code: string) =>
    request<LoginData>(`/auth/kakao/callback?code=${encodeURIComponent(code)}`),

  sendLetter: (payload: { templateId: string; to: string; body: string; from: string; stickers: object[] }) =>
    request<SendLetterData>('/letters', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getLetter: (shareToken: string) =>
    request<LetterData>(`/letters/share/${shareToken}`),
}
```

- [ ] **Step 2: 커밋**

```bash
git add culetter-react/src/api/client.ts
git commit -m "feat: add silent token refresh with retry on 401"
```

---

## Task 6: Write.tsx — 토큰 없을 때 요청 전 모달 표시

**Files:**
- Modify: `culetter-react/src/pages/Write.tsx`

**배경:** Task 5에서 토큰이 없을 때 `api.sendLetter`를 호출하면 client.ts가 refresh를 시도하다 실패해 `/login`으로 바로 이동한다. draft 보존을 위해 요청 전에 토큰 여부를 확인해 모달을 먼저 띄워야 한다.

- [ ] **Step 1: sendLetter 함수 상단에 토큰 체크 추가**

현재 `sendLetter` 함수:
```typescript
const sendLetter = async () => {
  if (!body.trim()) {
    show('편지 내용을 먼저 작성해 주세요 ✏️')
    return
  }
  setLoading(true)
  ...
}
```

변경 후:
```typescript
const sendLetter = async () => {
  if (!body.trim()) {
    show('편지 내용을 먼저 작성해 주세요 ✏️')
    return
  }
  if (!localStorage.getItem('culetter_access_token')) {
    setLoginRequired(true)
    return
  }
  setLoading(true)
  ...
}
```

- [ ] **Step 2: Vite dev server에서 동작 확인**

1. 브라우저 localStorage 전체 삭제 (개발자도구 → Application → Clear All)
2. `http://localhost:5173/write` 직접 접속
3. 편지 내용 입력 후 완료 클릭
4. "로그인이 필요해요" 모달 확인
5. "로그인하러 가기" 클릭 시 sessionStorage에 draft 저장 후 `/login` 이동 확인

- [ ] **Step 3: 커밋**

```bash
git add culetter-react/src/pages/Write.tsx
git commit -m "fix: show login modal before API call when no token"
```
