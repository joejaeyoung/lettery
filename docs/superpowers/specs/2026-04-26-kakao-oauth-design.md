# Kakao OAuth 실제 연동 설계

**날짜:** 2026-04-26
**버전:** 0.1
**범위:** mock 카카오 로그인 → 실제 카카오 OAuth Authorization Code Flow 교체

---

## 1. 목표

현재 `mockLogin()`으로 처리된 카카오 로그인을 실제 카카오 OAuth 2.0 Authorization Code Flow로 교체한다.
프론트(React SPA)가 code를 받아 백엔드에 전달하고, 백엔드가 카카오 API를 호출해 JWT를 발급한다.

---

## 2. 전체 흐름

```
[사용자] 카카오로 시작하기 클릭
    ↓
[Login.tsx] kauth.kakao.com/oauth/authorize 로 리다이렉트
    ↓
[카카오] 로그인 후 http://localhost:5173/login?code=ABC123 으로 리다이렉트
    ↓
[Login.tsx] useEffect에서 URL code 감지
    → window.history.replaceState로 code 제거 (히스토리 오염 방지)
    → GET /v1/auth/kakao/callback?code=ABC123 호출
    ↓
[AuthController] AuthService.kakaoLogin(code) 호출
    ↓
[AuthService]
  1. KakaoAuthClient.getToken(code) → 카카오 access token 획득
  2. KakaoAuthClient.getUserInfo(kakaoAccessToken) → 닉네임, 이메일 획득
  3. email 기준 users 테이블 upsert
  4. JWT(access 1h / refresh 14d) 발급
    ↓
[Login.tsx] accessToken, refreshToken localStorage 저장 → /select 이동
```

---

## 3. 백엔드 설계

### 3.1 새 파일: `KakaoAuthClient.java`

카카오 API 호출만 담당하는 컴포넌트. `RestClient`(Spring 6.1+) 사용.

**토큰 발급:**
```
POST https://kauth.kakao.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
client_id={culetter.kakao.client-id}
redirect_uri={culetter.kakao.redirect-uri}
code={code}

→ KakaoTokenResponse { String accessToken }
```

**유저 정보 조회:**
```
GET https://kapi.kakao.com/v2/user/me
Authorization: Bearer {kakaoAccessToken}

→ KakaoUserResponse {
    Long id,
    KakaoAccount kakaoAccount {
      String email,           // nullable — 동의 안 한 경우 없음
      Profile profile {
        String nickname
      }
    }
  }
```

이메일 미동의 시 폴백: `{kakaoId}@kakao.local`

**에러 처리:**
- 카카오 토큰 요청 실패 (잘못된 code, 만료) → `KakaoAuthException` → 401
- 카카오 유저 정보 요청 실패 → 500

### 3.2 `AuthService` 변경

```
kakaoLogin(String code):
  1. kakaoAuthClient.getToken(code) → kakaoAccessToken
  2. kakaoAuthClient.getUserInfo(kakaoAccessToken) → (kakaoId, nickname, email)
  3. email = kakaoAccount.email ?? "{kakaoId}@kakao.local"
  4. userRepository.findByEmail(email).orElseGet(() -> save new User(nickname, email))
  5. JWT 발급 → LoginResult 반환

mockLogin(): 유지 — 테스트 전용
```

### 3.3 `AuthController` 변경

```java
// 기존
authService.mockLogin()
// 변경
authService.kakaoLogin(code)
```

### 3.4 설정 추가

**`application.properties`:**
```properties
culetter.kakao.client-id=8f80bad6245d5c7a9f6c820f91a0c6e0
culetter.kakao.redirect-uri=http://localhost:5173/login
```

**`test/application.properties`:** 변경 없음 — 테스트는 `mockLogin()` 직접 호출

### 3.5 새 예외 클래스: `KakaoAuthException`

`RuntimeException` 상속. `GlobalExceptionHandler`에서 401로 처리.

---

## 4. 프론트엔드 설계

### 4.1 `.env.local` 추가

```
VITE_KAKAO_CLIENT_ID=8f80bad6245d5c7a9f6c820f91a0c6e0
VITE_KAKAO_REDIRECT_URI=http://localhost:5173/login
```

### 4.2 `Login.tsx` 변경

**버튼 클릭:** 카카오 인증 페이지로 리다이렉트
```typescript
const kakaoAuthUrl =
  `https://kauth.kakao.com/oauth/authorize` +
  `?client_id=${import.meta.env.VITE_KAKAO_CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(import.meta.env.VITE_KAKAO_REDIRECT_URI)}` +
  `&response_type=code`

window.location.href = kakaoAuthUrl
```

**마운트 시 code 감지:**
```typescript
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
```

### 4.3 `api/client.ts` 변경

```typescript
// mockLogin() 제거, kakaoLogin 추가
kakaoLogin: (code: string) =>
  request<LoginData>(`/auth/kakao/callback?code=${encodeURIComponent(code)}`)
```

---

## 5. 파일 변경 목록

| 파일 | 변경 유형 |
|------|----------|
| `auth/KakaoAuthClient.java` | 신규 |
| `auth/KakaoTokenResponse.java` | 신규 (record) |
| `auth/KakaoUserResponse.java` | 신규 (record) |
| `auth/KakaoAuthException.java` | 신규 |
| `auth/AuthService.java` | 수정 — kakaoLogin 추가 |
| `auth/AuthController.java` | 수정 — kakaoLogin 호출 |
| `common/GlobalExceptionHandler.java` | 수정 — KakaoAuthException → 401 |
| `resources/application.properties` | 수정 — kakao 설정 추가 |
| `culetter-react/.env.local` | 수정 — kakao 환경변수 추가 |
| `culetter-react/src/pages/Login.tsx` | 수정 — 리다이렉트 + code 감지 |
| `culetter-react/src/api/client.ts` | 수정 — kakaoLogin 메서드 |

---

## 6. 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-04-26 | 0.1 | 초안 |
