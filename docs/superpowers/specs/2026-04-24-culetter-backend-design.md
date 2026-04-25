# Culetter 백엔드 구현 설계

**날짜:** 2026-04-24  
**버전:** 0.1  
**범위:** Spring Boot 백엔드 MVP 구현 + React 프론트 연동

---

## 1. 목표

현재 localStorage/sessionStorage 기반으로 동작하는 React 프론트(culetter-react)를 실제 Spring Boot 백엔드(letter)와 연동한다.  
MVP 범위는 핵심 3개 플로우로 한정한다.

---

## 2. 기술 스택

| 구분 | 선택 |
|------|------|
| 백엔드 | Spring Boot 4.0.6, Java 17 |
| ORM | Spring Data JPA (Hibernate) |
| DB | MySQL |
| 인증 | JWT (JJWT 0.12.x), Access 1h / Refresh 14d |
| 카카오 OAuth | Mock 처리 (실제 앱 키 없음) |
| 프론트 | React 18 + Vite + TypeScript |
| CORS | Spring CorsFilter — `http://localhost:*` 패턴 허용 |
| 이미지 | React public 폴더 정적 파일, S3 미사용 |

---

## 3. 구현 범위 (MVP 핵심 플로우)

### 3.1 포함

1. **Mock 로그인** — `GET /v1/auth/kakao/callback?code=mock` → 더미 유저 upsert + JWT 발급
2. **편지 발송** — `POST /v1/letters` (JWT 인증 필요) → DB 저장 + shareToken 반환
3. **편지 열람** — `GET /v1/letters/share/{shareToken}` (인증 불필요) → 편지 내용 반환

### 3.2 제외 (추후 구현)

- 실제 카카오 OAuth (앱 키 연동)
- 임시저장 API (`/letters/drafts`)
- 보낸 편지함 (`/letters/sent`)
- 편지지 목록 API (`/templates`)
- 스티커, 카카오톡 공유 API
- 회원탈퇴, 토큰 재발급

---

## 4. 백엔드 패키지 구조

```
com.example.letter/
  auth/
    AuthController       GET /v1/auth/kakao/callback
    AuthService          유저 upsert, JWT 발급 로직
    JwtProvider          토큰 생성/파싱/검증
  letter/
    LetterController     POST /v1/letters, GET /v1/letters/share/{token}
    LetterService        편지 저장, shareToken 생성, 열람 처리
    LetterRepository     JpaRepository<Letter, Long>
    Letter               @Entity
  user/
    UserRepository       JpaRepository<User, Long>
    User                 @Entity
  config/
    CorsConfig           GlobalCorsFilter (localhost:* 허용)
    JwtAuthFilter        OncePerRequestFilter — JWT 검증 후 SecurityContext 주입
    SecurityConfig       /v1/letters/share/** 공개, 나머지 인증 필요
  common/
    ApiResponse<T>       { ok:true, data:T } 또는 { ok:false, error:{code,message} }
    ErrorCode            UNAUTHORIZED, LETTER_NOT_FOUND 등 enum
```

---

## 5. DB 스키마

```sql
CREATE TABLE users (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  nickname   VARCHAR(30)  NOT NULL DEFAULT '익명',
  email      VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE letters (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id          BIGINT       NOT NULL,
  template_id      VARCHAR(30)  NOT NULL,
  to_name          VARCHAR(20)  NOT NULL,
  body             TEXT         NOT NULL,
  from_name        VARCHAR(20)  NOT NULL,
  share_token      VARCHAR(12)  NOT NULL UNIQUE,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  first_opened_at  DATETIME     NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 6. API 상세 설계

### 6.1 Mock 로그인

```
GET /v1/auth/kakao/callback?code={any}

동작:
  - code 값 무시
  - email: "mock@culetter.com" 으로 users 테이블 upsert
  - accessToken(1h), refreshToken(14d) 발급

응답 200:
{
  "ok": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": 1, "nickname": "연우", "email": "mock@culetter.com" }
  }
}
```

### 6.2 편지 발송

```
POST /v1/letters
Authorization: Bearer <accessToken>

요청:
{
  "templateId": "tmpl_mint",
  "to": "지은이",
  "body": "오늘 하루도 고생 많았지...",
  "from": "연우",
  "stickers": []
}

검증:
  - body 최대 2000자
  - to, from 각 최대 20자

동작:
  - shareToken = UUID.randomUUID().toString().replace("-","").substring(0, 12)
  - letters 테이블 INSERT
  - shareUrl = culetter.base-url + "/letter/" + shareToken

응답 200:
{
  "ok": true,
  "data": {
    "id": 1,
    "shareToken": "xyz123abcdef",
    "shareUrl": "http://localhost:5173/letter/xyz123abcdef",
    "createdAt": "2026-04-24T12:00:00Z"
  }
}

에러:
  - 401: 토큰 없음/만료
  - 400: 유효성 검사 실패
```

### 6.3 편지 열람

```
GET /v1/letters/share/{shareToken}
인증 불필요

동작:
  - shareToken으로 Letter 조회
  - first_opened_at NULL이면 현재 시각 UPDATE
  - templateId → imageUrl 매핑 (하드코딩 맵)

응답 200:
{
  "ok": true,
  "data": {
    "id": 1,
    "template": {
      "id": "tmpl_mint",
      "name": "꽃비 민트",
      "imageUrl": "/images/편지지_꽃비_민트.png"
    },
    "to": "지은이",
    "body": "오늘 하루도 고생 많았지...",
    "from": "연우",
    "sentAt": "2026-04-24T12:00:00Z"
  }
}

에러:
  - 404: shareToken 없음
```

---

## 7. 템플릿 ID → imageUrl 매핑 (백엔드 하드코딩)

| templateId | imageUrl |
|-----------|----------|
| tmpl_mint | /images/편지지_꽃비_민트.png |
| tmpl_lavender | /images/편지지_달빛_라벤더.png |
| tmpl_starpink | /images/편지지_별하늘_핑크.png |
| tmpl_birthday | /images/편지지1.png |
| tmpl_friendship | /images/편지지2.png |
| tmpl_angel | /images/편지지3.png |

---

## 8. CORS 설정

```java
// CorsConfig.java
allowedOriginPatterns: "http://localhost:*"
allowedMethods: GET, POST, PUT, PATCH, DELETE, OPTIONS
allowedHeaders: *
allowCredentials: true
```

---

## 9. 프론트엔드 변경사항

### 9.1 신규 파일

`src/api/client.ts` — fetch 래퍼, base URL 주입, JWT 헤더 자동 추가, 에러 처리

```typescript
// .env.local
VITE_API_BASE=http://localhost:8080/v1
```

### 9.2 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `Login.tsx` | 카카오 버튼 → GET /auth/kakao/callback?code=mock 호출 → token 저장 → navigate |
| `Write.tsx` | `sendLetter()` → POST /letters → shareToken으로 /send?t={token} |
| `Read.tsx` | sessionStorage 대신 GET /letters/share/{token} 호출 |

---

## 10. application.properties 추가 설정

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/culetter?serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

culetter.jwt.secret=<256bit-secret>
culetter.jwt.access-expiry=3600
culetter.jwt.refresh-expiry=1209600
culetter.base-url=http://localhost:5173
```

---

## 11. 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-04-24 | 0.1 | 초안 |
