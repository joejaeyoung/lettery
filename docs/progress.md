# Culetter 개발 진행 현황

> 마지막 업데이트: 2026-04-28

---

## 완료된 작업

### 백엔드 (Spring Boot 4.0.6 / Java 17)

| 항목 | 내용 |
|------|------|
| 인증 | Kakao OAuth 2.0 Authorization Code Flow, JWT access(1h) / refresh(14d) |
| 유저 | User 엔티티, email upsert, 닉네임 자동 갱신 |
| 편지 | 편지 발송(POST /v1/letters), 열람(GET /v1/letters/share/{token}) |
| 보안 | Spring Security 7 stateless, JwtAuthFilter, CORS CorsConfigurationSource |
| 예외처리 | GlobalExceptionHandler, KakaoAuthException → 401 |
| 설정 | RestClientConfig, client_secret 포함 토큰 교환 |
| 테스트 | AuthControllerTest, LetterControllerTest, JwtProviderTest (H2 인메모리) |

### 프론트엔드 (React 18 + Vite + TypeScript)

| 페이지 | 구현 내용 |
|--------|----------|
| Login | 카카오 리다이렉트, code 감지 → JWT 저장, useRef StrictMode 대응 |
| Select | 편지지 선택, 필터 탭 |
| Write | 편지 작성, POST /v1/letters 연동, 비로그인 시 로그인 유도 모달 |
| Send | shareToken 기반 링크 공유 |
| Read | GET /v1/letters/share/{token} 편지 열람 |
| Profile | 카카오 닉네임/이메일 표시, 로그아웃(토큰 삭제) |

### UX 개선

- 비로그인 편지 전송 시 → 로그인 유도 모달 + 편지 내용 임시 보존 후 복원
- Profile 하드코딩 → 실제 카카오 계정 정보 표시
- Share 링크 `window.location.origin` 기반 정상화

---

## 미구현 (추후 작업)

| 기능 | 우선순위 | 비고 |
|------|---------|------|
| 토큰 재발급 | 높음 | refresh token 저장됐으나 엔드포인트 없음. 14일 후 만료 시 재로그인 필요 |
| 보낸 편지함 | 중간 | GET /v1/letters (내가 보낸 편지 목록) — Profile에 🔒 표시 중 |
| 임시저장 | 중간 | Write.tsx에 🔒 표시 중. 현재는 로그인 유도 시에만 session 임시 보존 |
| 카카오톡 공유 | 중간 | Send.tsx에 🔒 표시 중. Kakao SDK 연동 필요 |
| 인증 가드 | 낮음 | /write, /select 등 로그인 없이 접근 가능. ProtectedRoute 컴포넌트 필요 |
| 스티커 | 낮음 | stickers: [] 빈 배열로 전송 중. 편지 꾸미기 기능 |
| 회원탈퇴 | 낮음 | Profile에 🔒 표시 중 |

---

## 로컬 실행 방법

```bash
# MySQL (Docker)
docker start <mysql-container-name>

# 백엔드
cd letter && ./gradlew bootRun

# 프론트엔드
cd culetter-react && npm run dev
```

- 백엔드: http://localhost:8080
- 프론트엔드: http://localhost:5173
- DB: MySQL culetter (password: culetter)
