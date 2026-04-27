# Kakao OAuth 실제 연동 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** mock 카카오 로그인을 실제 카카오 OAuth Authorization Code Flow로 교체한다.

**Architecture:** 프론트가 카카오 인증 페이지로 리다이렉트하고, 카카오가 code를 프론트 `/login?code=...`으로 돌려준다. 프론트는 code를 백엔드에 전달하고, 백엔드가 KakaoAuthClient로 카카오 API를 호출해 유저 정보를 가져온 후 JWT를 발급한다.

**Tech Stack:** Spring Boot 4.0.6 / RestClient (Spring 6.1+) / JJWT 0.12.3 / React 18 + Vite + TypeScript

---

## 파일 구조

| 파일 | 변경 |
|------|------|
| `letter/src/main/java/com/example/letter/auth/KakaoAuthException.java` | 신규 |
| `letter/src/main/java/com/example/letter/auth/KakaoTokenResponse.java` | 신규 |
| `letter/src/main/java/com/example/letter/auth/KakaoUserResponse.java` | 신규 |
| `letter/src/main/java/com/example/letter/auth/KakaoAuthClient.java` | 신규 |
| `letter/src/main/java/com/example/letter/auth/AuthService.java` | 수정 |
| `letter/src/main/java/com/example/letter/auth/AuthController.java` | 수정 |
| `letter/src/main/java/com/example/letter/common/GlobalExceptionHandler.java` | 수정 |
| `letter/src/main/resources/application.properties` | 수정 |
| `letter/src/test/resources/application.properties` | 수정 |
| `letter/src/test/java/com/example/letter/auth/AuthControllerTest.java` | 수정 |
| `culetter-react/.env.local` | 수정 |
| `culetter-react/src/api/client.ts` | 수정 |
| `culetter-react/src/pages/Login.tsx` | 수정 |

---

### Task 1: KakaoAuthException + GlobalExceptionHandler 업데이트

**Files:**
- Create: `letter/src/main/java/com/example/letter/auth/KakaoAuthException.java`
- Modify: `letter/src/main/java/com/example/letter/common/GlobalExceptionHandler.java`

- [ ] **Step 1: KakaoAuthException 생성**

```java
// letter/src/main/java/com/example/letter/auth/KakaoAuthException.java
package com.example.letter.auth;

public class KakaoAuthException extends RuntimeException {
    public KakaoAuthException(String message) {
        super(message);
    }
}
```

- [ ] **Step 2: GlobalExceptionHandler에 핸들러 추가**

기존 `GlobalExceptionHandler.java`에 다음 메서드를 추가한다 (기존 핸들러는 그대로 유지):

```java
@ExceptionHandler(KakaoAuthException.class)
@ResponseStatus(HttpStatus.UNAUTHORIZED)
public ApiResponse<?> handleKakaoAuth(KakaoAuthException e) {
    return ApiResponse.fail("KAKAO_AUTH_FAILED", e.getMessage());
}
```

import 추가:
```java
import com.example.letter.auth.KakaoAuthException;
```

- [ ] **Step 3: 기존 테스트가 여전히 통과하는지 확인**

```bash
cd letter
./gradlew test
```

Expected: BUILD SUCCESSFUL, 10 tests passed

- [ ] **Step 4: 커밋**

```bash
git add letter/src/main/java/com/example/letter/auth/KakaoAuthException.java
git add letter/src/main/java/com/example/letter/common/GlobalExceptionHandler.java
git commit -m "feat: add KakaoAuthException and 401 handler"
```

---

### Task 2: Kakao API 응답 DTO

**Files:**
- Create: `letter/src/main/java/com/example/letter/auth/KakaoTokenResponse.java`
- Create: `letter/src/main/java/com/example/letter/auth/KakaoUserResponse.java`

카카오 API 실제 응답 형태:
```json
// POST kauth.kakao.com/oauth/token
{ "access_token": "eyJ...", "token_type": "bearer", ... }

// GET kapi.kakao.com/v2/user/me
{
  "id": 123456789,
  "kakao_account": {
    "email": "user@kakao.com",
    "profile": { "nickname": "연우" }
  }
}
```

- [ ] **Step 1: KakaoTokenResponse 생성**

```java
// letter/src/main/java/com/example/letter/auth/KakaoTokenResponse.java
package com.example.letter.auth;

import com.fasterxml.jackson.annotation.JsonProperty;

public record KakaoTokenResponse(
    @JsonProperty("access_token") String accessToken
) {}
```

- [ ] **Step 2: KakaoUserResponse 생성**

중첩 record로 kakao_account 구조를 표현한다. `@JsonIgnoreProperties(ignoreUnknown = true)`로 미사용 필드를 무시한다.

```java
// letter/src/main/java/com/example/letter/auth/KakaoUserResponse.java
package com.example.letter.auth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record KakaoUserResponse(
    Long id,
    @JsonProperty("kakao_account") KakaoAccount kakaoAccount
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record KakaoAccount(
        String email,
        Profile profile
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Profile(String nickname) {}
}
```

- [ ] **Step 3: 컴파일 확인**

```bash
cd letter
./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 4: 커밋**

```bash
git add letter/src/main/java/com/example/letter/auth/KakaoTokenResponse.java
git add letter/src/main/java/com/example/letter/auth/KakaoUserResponse.java
git commit -m "feat: add Kakao API response DTOs"
```

---

### Task 3: KakaoAuthClient + 설정

**Files:**
- Create: `letter/src/main/java/com/example/letter/auth/KakaoAuthClient.java`
- Modify: `letter/src/main/resources/application.properties`
- Modify: `letter/src/test/resources/application.properties`

- [ ] **Step 1: application.properties에 카카오 설정 추가**

`letter/src/main/resources/application.properties` 하단에 추가:

```properties
culetter.kakao.client-id=8f80bad6245d5c7a9f6c820f91a0c6e0
culetter.kakao.redirect-uri=http://localhost:5173/login
```

- [ ] **Step 2: test/application.properties에 더미 카카오 설정 추가**

`letter/src/test/resources/application.properties` 하단에 추가
(테스트는 KakaoAuthClient를 mock하지만, Spring이 빈 생성 시 @Value를 읽으므로 더미 값 필요):

```properties
culetter.kakao.client-id=test-client-id
culetter.kakao.redirect-uri=http://localhost:5173/login
```

- [ ] **Step 3: KakaoAuthClient 생성**

`RestClient`(Spring 6.1+)를 사용해 카카오 API를 호출한다. `is4xxClientError` 시 `KakaoAuthException`을 던진다.

```java
// letter/src/main/java/com/example/letter/auth/KakaoAuthClient.java
package com.example.letter.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Component
public class KakaoAuthClient {

    private static final String TOKEN_URL = "https://kauth.kakao.com/oauth/token";
    private static final String USER_URL  = "https://kapi.kakao.com/v2/user/me";

    private final String clientId;
    private final String redirectUri;
    private final RestClient restClient;

    public KakaoAuthClient(
        @Value("${culetter.kakao.client-id}") String clientId,
        @Value("${culetter.kakao.redirect-uri}") String redirectUri
    ) {
        this.clientId    = clientId;
        this.redirectUri = redirectUri;
        this.restClient  = RestClient.create();
    }

    public KakaoTokenResponse getToken(String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type",   "authorization_code");
        form.add("client_id",    clientId);
        form.add("redirect_uri", redirectUri);
        form.add("code",         code);

        return restClient.post()
            .uri(TOKEN_URL)
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(form)
            .retrieve()
            .onStatus(status -> status.is4xxClientError(),
                (req, res) -> { throw new KakaoAuthException("카카오 토큰 발급 실패"); })
            .body(KakaoTokenResponse.class);
    }

    public KakaoUserResponse getUserInfo(String kakaoAccessToken) {
        return restClient.get()
            .uri(USER_URL)
            .header("Authorization", "Bearer " + kakaoAccessToken)
            .retrieve()
            .onStatus(status -> status.is4xxClientError(),
                (req, res) -> { throw new KakaoAuthException("카카오 유저 정보 조회 실패"); })
            .body(KakaoUserResponse.class);
    }
}
```

- [ ] **Step 4: 기존 테스트 통과 확인**

```bash
cd letter
./gradlew test
```

Expected: BUILD SUCCESSFUL, 10 tests passed
(KakaoAuthClient가 빈으로 등록되지만 아직 사용되지 않아 기존 테스트에 영향 없음)

- [ ] **Step 5: 커밋**

```bash
git add letter/src/main/java/com/example/letter/auth/KakaoAuthClient.java
git add letter/src/main/resources/application.properties
git add letter/src/test/resources/application.properties
git commit -m "feat: add KakaoAuthClient with RestClient"
```

---

### Task 4: AuthService.kakaoLogin() + AuthController + AuthControllerTest 교체

**Files:**
- Modify: `letter/src/main/java/com/example/letter/auth/AuthService.java`
- Modify: `letter/src/main/java/com/example/letter/auth/AuthController.java`
- Modify: `letter/src/test/java/com/example/letter/auth/AuthControllerTest.java`

- [ ] **Step 1: AuthControllerTest를 먼저 수정 (TDD — 실패하는 테스트 작성)**

`@MockitoBean`으로 KakaoAuthClient를 mock하고, 실제 카카오 응답을 시뮬레이션한다.
기존 두 테스트를 아래 세 테스트로 교체한다.

```java
// letter/src/test/java/com/example/letter/auth/AuthControllerTest.java
package com.example.letter.auth;

import com.example.letter.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;
    @MockitoBean KakaoAuthClient kakaoAuthClient;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        given(kakaoAuthClient.getToken("mock-code"))
            .willReturn(new KakaoTokenResponse("kakao-access-token-123"));
        given(kakaoAuthClient.getUserInfo("kakao-access-token-123"))
            .willReturn(new KakaoUserResponse(
                99L,
                new KakaoUserResponse.KakaoAccount(
                    "tester@kakao.com",
                    new KakaoUserResponse.Profile("테스터")
                )
            ));
    }

    @Test
    void kakaoLogin_accessToken_반환() throws Exception {
        mvc.perform(get("/v1/auth/kakao/callback").param("code", "mock-code"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.ok").value(true))
            .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
            .andExpect(jsonPath("$.data.user.email").value("tester@kakao.com"))
            .andExpect(jsonPath("$.data.user.nickname").value("테스터"));
    }

    @Test
    void kakaoLogin_중복호출시_같은유저_반환() throws Exception {
        mvc.perform(get("/v1/auth/kakao/callback").param("code", "mock-code"))
            .andExpect(status().isOk());

        given(kakaoAuthClient.getToken("mock-code-2"))
            .willReturn(new KakaoTokenResponse("kakao-access-token-456"));
        given(kakaoAuthClient.getUserInfo("kakao-access-token-456"))
            .willReturn(new KakaoUserResponse(
                99L,
                new KakaoUserResponse.KakaoAccount(
                    "tester@kakao.com",
                    new KakaoUserResponse.Profile("테스터")
                )
            ));

        mvc.perform(get("/v1/auth/kakao/callback").param("code", "mock-code-2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.user.email").value("tester@kakao.com"));
    }

    @Test
    void kakaoLogin_잘못된코드_401() throws Exception {
        given(kakaoAuthClient.getToken("bad-code"))
            .willThrow(new KakaoAuthException("카카오 토큰 발급 실패"));

        mvc.perform(get("/v1/auth/kakao/callback").param("code", "bad-code"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.ok").value(false))
            .andExpect(jsonPath("$.error.code").value("KAKAO_AUTH_FAILED"));
    }
}
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd letter
./gradlew test --tests "com.example.letter.auth.AuthControllerTest"
```

Expected: FAIL (Controller가 아직 mockLogin()을 호출하므로 `tester@kakao.com` 대신 `mock@culetter.com` 반환)

- [ ] **Step 3: AuthService에 kakaoLogin() 추가**

기존 `mockLogin()`은 그대로 유지하고 `kakaoLogin()`을 추가한다.

```java
// letter/src/main/java/com/example/letter/auth/AuthService.java
package com.example.letter.auth;

import com.example.letter.user.User;
import com.example.letter.user.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final KakaoAuthClient kakaoAuthClient;

    @Transactional
    public LoginResult kakaoLogin(String code) {
        KakaoTokenResponse tokenResponse = kakaoAuthClient.getToken(code);
        KakaoUserResponse userResponse   = kakaoAuthClient.getUserInfo(tokenResponse.accessToken());

        String email = Optional.ofNullable(userResponse.kakaoAccount())
            .map(KakaoUserResponse.KakaoAccount::email)
            .filter(e -> e != null && !e.isBlank())
            .orElse(userResponse.id() + "@kakao.local");

        String nickname = Optional.ofNullable(userResponse.kakaoAccount())
            .map(KakaoUserResponse.KakaoAccount::profile)
            .map(KakaoUserResponse.Profile::nickname)
            .filter(n -> n != null && !n.isBlank())
            .orElse("익명");

        User user = userRepository.findByEmail(email)
            .orElseGet(() -> userRepository.save(User.of(nickname, email)));

        return new LoginResult(
            jwtProvider.generateAccessToken(user.getId()),
            jwtProvider.generateRefreshToken(user.getId()),
            user.getId(),
            user.getNickname(),
            user.getEmail()
        );
    }

    @Transactional
    public LoginResult mockLogin() {
        User user = userRepository.findByEmail("mock@culetter.com")
            .orElseGet(() -> userRepository.save(User.of("연우", "mock@culetter.com")));

        return new LoginResult(
            jwtProvider.generateAccessToken(user.getId()),
            jwtProvider.generateRefreshToken(user.getId()),
            user.getId(),
            user.getNickname(),
            user.getEmail()
        );
    }

    @Getter
    @AllArgsConstructor
    public static class LoginResult {
        private final String accessToken;
        private final String refreshToken;
        private final Long userId;
        private final String nickname;
        private final String email;
    }
}
```

- [ ] **Step 4: AuthController에서 kakaoLogin() 호출로 변경**

```java
// letter/src/main/java/com/example/letter/auth/AuthController.java
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
```

- [ ] **Step 5: 전체 테스트 통과 확인**

```bash
cd letter
./gradlew test
```

Expected: BUILD SUCCESSFUL, 12 tests passed (기존 10개 + 신규 AuthControllerTest 3개 - 기존 2개 = 11개 → 실제로 AuthControllerTest 2→3으로 교체, 총 11개)

- [ ] **Step 6: 커밋**

```bash
git add letter/src/main/java/com/example/letter/auth/AuthService.java
git add letter/src/main/java/com/example/letter/auth/AuthController.java
git add letter/src/test/java/com/example/letter/auth/AuthControllerTest.java
git commit -m "feat: replace mockLogin with real kakaoLogin using KakaoAuthClient"
```

---

### Task 5: 프론트엔드 연동

**Files:**
- Modify: `culetter-react/.env.local`
- Modify: `culetter-react/src/api/client.ts`
- Modify: `culetter-react/src/pages/Login.tsx`

- [ ] **Step 1: .env.local에 카카오 환경변수 추가**

`culetter-react/.env.local`에 추가:

```
VITE_KAKAO_CLIENT_ID=8f80bad6245d5c7a9f6c820f91a0c6e0
VITE_KAKAO_REDIRECT_URI=http://localhost:5173/login
```

- [ ] **Step 2: api/client.ts — mockLogin을 kakaoLogin으로 교체**

```typescript
// culetter-react/src/api/client.ts
const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080/v1'

function getToken(): string | null {
  return localStorage.getItem('culetter_access_token')
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers })
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

- [ ] **Step 3: Login.tsx 교체**

버튼 클릭 → 카카오 인증 페이지 리다이렉트.
마운트 시 URL에서 `code` 감지 → 백엔드 호출 → JWT 저장 → `/select` 이동.

```tsx
// culetter-react/src/pages/Login.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { LOGO_SVG } from '../data'
import { api } from '../api/client'
import { useToast } from '../hooks/useToast'

const KAKAO_AUTH_URL =
  `https://kauth.kakao.com/oauth/authorize` +
  `?client_id=${import.meta.env.VITE_KAKAO_CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(import.meta.env.VITE_KAKAO_REDIRECT_URI ?? 'http://localhost:5173/login')}` +
  `&response_type=code`

export default function Login() {
  const navigate = useNavigate()
  const { show } = useToast()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) return

    window.history.replaceState({}, '', '/login')
    setLoading(true)

    api.kakaoLogin(code)
      .then(data => {
        localStorage.setItem('culetter_access_token', data.accessToken)
        localStorage.setItem('culetter_refresh_token', data.refreshToken)
        navigate('/select')
      })
      .catch(() => show('로그인에 실패했어요 😢'))
      .finally(() => setLoading(false))
  }, [])

  const handleKakaoLogin = () => {
    window.location.href = KAKAO_AUTH_URL
  }

  return (
    <section className="page active" id="page-login">
      <Header right="back" />
      <main className="login-wrap">
        <div className="login-card">
          <div className="login-brand">
            <img className="login-brand-logo" src={LOGO_SVG} alt="Culetter" />
            <div className="login-brand-texts">
              <div className="login-brand-title">Culetter</div>
              <div className="login-brand-sub">마음을 전할 때 큐레터가 함께해요</div>
            </div>
          </div>
          <div className="login-form-wrap">
            <div className="login-form-inner">
              <div className="login-form-title">로그인</div>
              <div className="login-form-body">
                <div className="login-hint">3초만에 로그인하기</div>
                <button className="btn-kakao" onClick={handleKakaoLogin} disabled={loading}>
                  <span style={{ fontSize: 16 }}>💬</span>
                  <span>{loading ? '로그인 중...' : '카카오로 시작하기'}</span>
                </button>
              </div>
            </div>
            <div className="login-terms">
              로그인 시 <a>서비스 이용약관</a> 및 <a>개인정보처리방침</a>에 동의하게 됩니다.
            </div>
          </div>
        </div>
      </main>
    </section>
  )
}
```

- [ ] **Step 4: 커밋**

```bash
git add culetter-react/.env.local culetter-react/src/api/client.ts culetter-react/src/pages/Login.tsx
git commit -m "feat: wire Login page to real Kakao OAuth flow"
```

- [ ] **Step 5: 수동 브라우저 테스트**

1. `cd letter && ./gradlew bootRun` (백엔드 기동)
2. `cd culetter-react && npm run dev` (프론트 기동)
3. `http://localhost:5173/login` 접속
4. "카카오로 시작하기" 클릭 → 카카오 로그인 페이지로 이동 확인
5. 카카오 계정으로 로그인 → `http://localhost:5173/login?code=...`으로 리다이렉트
6. 자동으로 `/select`로 이동 확인
7. localStorage에 `culetter_access_token` 저장 확인 (개발자 도구 → Application → Local Storage)

---

## 셀프 리뷰

**스펙 커버리지:**
- ✅ KakaoAuthClient — getToken(), getUserInfo() (Task 3)
- ✅ 이메일 미동의 폴백 `{id}@kakao.local` (Task 4)
- ✅ KakaoAuthException → 401 (Task 1 + 4)
- ✅ AuthService.kakaoLogin() (Task 4)
- ✅ AuthController 교체 (Task 4)
- ✅ 프론트 리다이렉트 + code 감지 (Task 5)
- ✅ .env.local 환경변수 (Task 5)
- ✅ mockLogin() 테스트 전용 유지 (Task 4)

**타입 일관성:**
- `KakaoTokenResponse.accessToken()` — Task 2 정의, Task 3 사용 ✅
- `KakaoUserResponse.kakaoAccount()`, `.profile()`, `.nickname()` — Task 2 정의, Task 4 사용 ✅
- `api.kakaoLogin(code)` — Task 5 client.ts 정의, Login.tsx 사용 ✅
