# JWT 토큰 재발급 설계

**날짜:** 2026-04-28
**버전:** 0.1
**범위:** refresh token으로 access token 자동 갱신, 401 시 silent retry

---

## 1. 목표

access token(1시간) 만료 시 사용자 개입 없이 refresh token(14일)으로 자동 갱신하고, 실패한 요청을 재시도한다.
refresh token도 만료된 경우 localStorage를 정리하고 `/login`으로 이동한다.

---

## 2. 전체 흐름

```
[client.ts] 요청 전송
    ↓
[백엔드] access token 만료 → 401 응답
    ↓
[client.ts] 401 감지
    → refreshPromise 없으면: POST /v1/auth/refresh 호출
    → refreshPromise 있으면: 기존 promise 대기 (동시 401 중복 방지)
    ↓
성공: 새 accessToken localStorage 저장 → 원래 요청 재시도
실패: localStorage 전체 삭제 → window.location.href = '/login'
```

---

## 3. 백엔드 설계

### 3.1 JwtProvider 변경

`type` claim 추가로 access/refresh 토큰 구분.

```java
// 기존
private String buildToken(Long userId, long expirySeconds)

// 변경
private String buildToken(Long userId, long expirySeconds, String type)
// claim: { sub: String(userId), type: "access"|"refresh", iat, exp }
```

신규 메서드:
```java
public String generateAccessToken(Long userId)   // type = "access"
public String generateRefreshToken(Long userId)  // type = "refresh"
public boolean isRefreshToken(String token)      // type == "refresh" 확인
```

`isValid()`는 서명+만료만 검증 (기존 동작 유지).

### 3.2 JwtAuthFilter 변경

`type == "access"`인 토큰만 인증 통과시킨다.
refresh token을 Authorization 헤더에 넣어 API를 호출하는 것을 방지.

```java
// 기존: isValid(token) 이면 인증 통과
// 변경: isValid(token) && !jwtProvider.isRefreshToken(token) 이면 인증 통과
```

### 3.3 신규: RefreshController

```
POST /v1/auth/refresh
Content-Type: application/json

Request:  { "refreshToken": "..." }
Response (200): { "ok": true, "data": { "accessToken": "..." } }
Response (401): { "ok": false, "error": { "code": "INVALID_REFRESH_TOKEN" } }
```

처리 로직:
1. `jwtProvider.isValid(refreshToken)` → false면 401
2. `jwtProvider.isRefreshToken(refreshToken)` → false면 401
3. `jwtProvider.extractUserId(refreshToken)` → userId 추출
4. `jwtProvider.generateAccessToken(userId)` → 새 access token 반환

`RefreshRequest` record: `String refreshToken`

### 3.4 GlobalExceptionHandler

`InvalidRefreshTokenException` (신규) → 401 처리 추가.

### 3.5 SecurityConfig

`/v1/auth/**` 이미 `permitAll()` → 변경 없음.

---

## 4. 프론트엔드 설계

### 4.1 client.ts 변경

`refreshPromise` 모듈 변수로 동시 refresh 중복 방지.

```typescript
let refreshPromise: Promise<string> | null = null

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
```

`request<T>()` 함수 내 401 처리:

```typescript
if (res.status === 401) {
  try {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null })
    }
    const newToken = await refreshPromise
    // 원래 요청 재시도
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
```

---

## 5. 파일 변경 목록

| 파일 | 변경 유형 |
|------|----------|
| `auth/JwtProvider.java` | 수정 — type claim 추가, isRefreshToken() 추가 |
| `config/JwtAuthFilter.java` | 수정 — type == "access" 검사 추가 |
| `auth/RefreshController.java` | 신규 |
| `auth/RefreshRequest.java` | 신규 (record) |
| `auth/InvalidRefreshTokenException.java` | 신규 |
| `common/GlobalExceptionHandler.java` | 수정 — InvalidRefreshTokenException → 401 |
| `culetter-react/src/api/client.ts` | 수정 — refreshAccessToken(), 401 retry 로직 |
| `test/auth/RefreshControllerTest.java` | 신규 |
| `test/auth/JwtProviderTest.java` | 수정 — type claim 검증 추가 |

---

## 6. 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-04-28 | 0.1 | 초안 |
