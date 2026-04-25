# Culetter Backend + Frontend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spring Boot 백엔드 MVP 3개 엔드포인트(mock 로그인, 편지 발송, 편지 열람) 구현 및 React 프론트 연동

**Architecture:** 기능별 패키지(auth/letter/user/config/common), MySQL + JPA, JJWT 0.12.x 기반 stateless JWT 인증. 프론트는 `api/client.ts` fetch 래퍼를 통해 백엔드 호출.

**Tech Stack:** Spring Boot 4.0.6, Java 17, MySQL, Spring Data JPA, Spring Security, JJWT 0.12.3, React 18, TypeScript, Vite

---

## 파일 맵

### 신규 생성 (백엔드)
| 파일 | 역할 |
|------|------|
| `letter/build.gradle` | 의존성 추가 (JPA, Security, MySQL, JJWT, Validation) |
| `letter/src/main/resources/application.properties` | DB/JWT/앱 설정 추가 |
| `letter/src/test/resources/application.properties` | H2 인메모리 테스트 DB 설정 |
| `common/ApiResponse.java` | `{ ok, data }` / `{ ok, error }` 공통 응답 래퍼 |
| `common/GlobalExceptionHandler.java` | 404/400/401 전역 예외 처리 |
| `user/User.java` | @Entity users 테이블 |
| `user/UserRepository.java` | JpaRepository<User, Long> |
| `auth/JwtProvider.java` | 토큰 생성/파싱/검증 |
| `auth/AuthService.java` | mock 유저 upsert + JWT 발급 |
| `auth/AuthController.java` | GET /v1/auth/kakao/callback |
| `config/CorsConfig.java` | localhost:* 전 포트 허용 |
| `config/JwtAuthFilter.java` | Bearer 토큰 → SecurityContext 주입 |
| `config/SecurityConfig.java` | /v1/auth/**, /v1/letters/share/** 공개 |
| `letter/Letter.java` | @Entity letters 테이블 |
| `letter/LetterRepository.java` | JpaRepository<Letter, Long> |
| `letter/LetterService.java` | 편지 저장 + shareToken 생성 + 열람 처리 |
| `letter/LetterController.java` | POST /v1/letters, GET /v1/letters/share/{token} |
| `letter/LetterNotFoundException.java` | 404 예외 |
| `letter/SendLetterRequest.java` | @Valid 요청 DTO |
| `letter/SendLetterResponse.java` | 발송 응답 DTO |
| `letter/ReadLetterResponse.java` | 열람 응답 DTO |

### 신규 생성 (프론트엔드)
| 파일 | 역할 |
|------|------|
| `culetter-react/.env.local` | VITE_API_BASE 환경변수 |
| `culetter-react/src/api/client.ts` | fetch 래퍼, JWT 헤더 자동 주입 |

### 수정 (프론트엔드)
| 파일 | 변경 내용 |
|------|----------|
| `culetter-react/src/pages/Login.tsx` | 카카오 버튼 → mock login API 호출 |
| `culetter-react/src/pages/Write.tsx` | sendLetter() → POST /letters |
| `culetter-react/src/pages/Read.tsx` | GET /letters/share/{token} 호출 |

---

## Task 1: 프로젝트 설정 (build.gradle, properties, DB)

**Files:**
- Modify: `letter/build.gradle`
- Modify: `letter/src/main/resources/application.properties`
- Create: `letter/src/test/resources/application.properties`

- [ ] **Step 1: MySQL DB 생성**

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS culetter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Expected: Query OK

- [ ] **Step 2: build.gradle 업데이트**

`letter/build.gradle`을 아래로 교체:

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '4.0.6'
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'com.example'
version = '0.0.1-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-webmvc'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'com.mysql:mysql-connector-j'
    implementation 'io.jsonwebtoken:jjwt-api:0.12.3'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.3'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.3'
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-webmvc-test'
    testImplementation 'org.springframework.security:spring-security-test'
    testRuntimeOnly 'com.h2database:h2'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
    testCompileOnly 'org.projectlombok:lombok'
    testAnnotationProcessor 'org.projectlombok:lombok'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

- [ ] **Step 3: application.properties 업데이트**

`letter/src/main/resources/application.properties`:

```properties
spring.application.name=letter

spring.datasource.url=jdbc:mysql://localhost:3306/culetter?serverTimezone=UTC&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

culetter.jwt.secret=mySuperSecretKeyForCuletterDevOnly32B!!
culetter.jwt.access-expiry=3600
culetter.jwt.refresh-expiry=1209600
culetter.base-url=http://localhost:5173
```

- [ ] **Step 4: 테스트 application.properties 생성**

`letter/src/test/resources/application.properties`:

```properties
spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=MySQL
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=create-drop

culetter.jwt.secret=mySuperSecretKeyForCuletterDevOnly32B!!
culetter.jwt.access-expiry=3600
culetter.jwt.refresh-expiry=1209600
culetter.base-url=http://localhost:5173
```

- [ ] **Step 5: 의존성 다운로드 확인**

```bash
cd letter && ./gradlew dependencies --configuration runtimeClasspath | grep -E "jjwt|mysql|security|jpa"
```

Expected: 위 라이브러리들이 출력에 포함됨

- [ ] **Step 6: 기본 빌드 통과 확인**

```bash
cd letter && ./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 7: Commit**

```bash
cd letter
git add build.gradle src/main/resources/application.properties src/test/resources/application.properties
git commit -m "chore: add JPA, Security, JJWT, MySQL dependencies and configure properties"
```

---

## Task 2: 공통 레이어 (ApiResponse, LetterNotFoundException, GlobalExceptionHandler)

**Files:**
- Create: `letter/src/main/java/com/example/letter/common/ApiResponse.java`
- Create: `letter/src/main/java/com/example/letter/letter/LetterNotFoundException.java`
- Create: `letter/src/main/java/com/example/letter/common/GlobalExceptionHandler.java`

- [ ] **Step 1: ApiResponse 작성**

`letter/src/main/java/com/example/letter/common/ApiResponse.java`:

```java
package com.example.letter.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private final boolean ok;
    private final T data;
    private final ErrorBody error;

    private ApiResponse(boolean ok, T data, ErrorBody error) {
        this.ok = ok;
        this.data = data;
        this.error = error;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static ApiResponse<?> fail(String code, String message) {
        return new ApiResponse<>(false, null, new ErrorBody(code, message));
    }

    @Getter
    public static class ErrorBody {
        private final String code;
        private final String message;

        ErrorBody(String code, String message) {
            this.code = code;
            this.message = message;
        }
    }
}
```

- [ ] **Step 2: LetterNotFoundException 작성**

`letter/src/main/java/com/example/letter/letter/LetterNotFoundException.java`:

```java
package com.example.letter.letter;

public class LetterNotFoundException extends RuntimeException {
    public LetterNotFoundException() {
        super("letter not found");
    }
}
```

- [ ] **Step 3: GlobalExceptionHandler 작성**

`letter/src/main/java/com/example/letter/common/GlobalExceptionHandler.java`:

```java
package com.example.letter.common;

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
}
```

- [ ] **Step 4: 컴파일 확인**

```bash
cd letter && ./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 5: Commit**

```bash
cd letter
git add src/main/java/com/example/letter/common/ \
        src/main/java/com/example/letter/letter/LetterNotFoundException.java
git commit -m "feat: add ApiResponse, GlobalExceptionHandler, LetterNotFoundException"
```

---

## Task 3: User 엔티티 + Repository

**Files:**
- Create: `letter/src/main/java/com/example/letter/user/User.java`
- Create: `letter/src/main/java/com/example/letter/user/UserRepository.java`

- [ ] **Step 1: User 엔티티 작성**

`letter/src/main/java/com/example/letter/user/User.java`:

```java
package com.example.letter.user;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String nickname;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static User of(String nickname, String email) {
        User user = new User();
        user.nickname = nickname;
        user.email = email;
        user.createdAt = LocalDateTime.now();
        return user;
    }
}
```

- [ ] **Step 2: UserRepository 작성**

`letter/src/main/java/com/example/letter/user/UserRepository.java`:

```java
package com.example.letter.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
```

- [ ] **Step 3: 컴파일 확인**

```bash
cd letter && ./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
cd letter
git add src/main/java/com/example/letter/user/
git commit -m "feat: add User entity and UserRepository"
```

---

## Task 4: JwtProvider

**Files:**
- Create: `letter/src/main/java/com/example/letter/auth/JwtProvider.java`
- Create: `letter/src/test/java/com/example/letter/auth/JwtProviderTest.java`

- [ ] **Step 1: 테스트 작성**

`letter/src/test/java/com/example/letter/auth/JwtProviderTest.java`:

```java
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
}
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd letter && ./gradlew test --tests "com.example.letter.auth.JwtProviderTest" 2>&1 | tail -20
```

Expected: FAILED — JwtProvider not found

- [ ] **Step 3: JwtProvider 구현**

`letter/src/main/java/com/example/letter/auth/JwtProvider.java`:

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
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd letter && ./gradlew test --tests "com.example.letter.auth.JwtProviderTest"
```

Expected: 3 tests PASSED

- [ ] **Step 5: Commit**

```bash
cd letter
git add src/main/java/com/example/letter/auth/JwtProvider.java \
        src/test/java/com/example/letter/auth/JwtProviderTest.java
git commit -m "feat: add JwtProvider with access/refresh token generation and validation"
```

---

## Task 5: AuthService + AuthController (Mock 로그인)

**Files:**
- Create: `letter/src/main/java/com/example/letter/auth/AuthService.java`
- Create: `letter/src/main/java/com/example/letter/auth/AuthController.java`
- Create: `letter/src/test/java/com/example/letter/auth/AuthControllerTest.java`

- [ ] **Step 1: 테스트 작성**

`letter/src/test/java/com/example/letter/auth/AuthControllerTest.java`:

```java
package com.example.letter.auth;

import com.example.letter.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void mockLogin_accessToken_반환() throws Exception {
        mvc.perform(get("/v1/auth/kakao/callback").param("code", "mock"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.ok").value(true))
            .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
            .andExpect(jsonPath("$.data.user.email").value("mock@culetter.com"));
    }

    @Test
    void mockLogin_중복호출시_같은유저_반환() throws Exception {
        mvc.perform(get("/v1/auth/kakao/callback").param("code", "any"))
            .andExpect(status().isOk());

        mvc.perform(get("/v1/auth/kakao/callback").param("code", "any"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.user.email").value("mock@culetter.com"));

        assert userRepository.count() == 1;
    }
}
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd letter && ./gradlew test --tests "com.example.letter.auth.AuthControllerTest" 2>&1 | tail -20
```

Expected: FAILED — AuthController not found

- [ ] **Step 3: AuthService 구현**

`letter/src/main/java/com/example/letter/auth/AuthService.java`:

```java
package com.example.letter.auth;

import com.example.letter.user.User;
import com.example.letter.user.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;

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

- [ ] **Step 4: AuthController 구현**

`letter/src/main/java/com/example/letter/auth/AuthController.java`:

```java
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
        AuthService.LoginResult result = authService.mockLogin();

        return ApiResponse.ok(Map.of(
            "accessToken", result.getAccessToken(),
            "refreshToken", result.getRefreshToken(),
            "user", Map.of(
                "id", result.getUserId(),
                "nickname", result.getNickname(),
                "email", result.getEmail()
            )
        ));
    }
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
cd letter && ./gradlew test --tests "com.example.letter.auth.AuthControllerTest"
```

Expected: 2 tests PASSED

- [ ] **Step 6: Commit**

```bash
cd letter
git add src/main/java/com/example/letter/auth/ \
        src/test/java/com/example/letter/auth/AuthControllerTest.java
git commit -m "feat: add mock Kakao login endpoint — returns JWT access/refresh tokens"
```

---

## Task 6: Security + CORS 설정

**Files:**
- Create: `letter/src/main/java/com/example/letter/config/CorsConfig.java`
- Create: `letter/src/main/java/com/example/letter/config/JwtAuthFilter.java`
- Create: `letter/src/main/java/com/example/letter/config/SecurityConfig.java`

- [ ] **Step 1: CorsConfig 작성**

`letter/src/main/java/com/example/letter/config/CorsConfig.java`:

```java
package com.example.letter.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
```

- [ ] **Step 2: JwtAuthFilter 작성**

`letter/src/main/java/com/example/letter/config/JwtAuthFilter.java`:

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
            if (jwtProvider.isValid(token)) {
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

- [ ] **Step 3: SecurityConfig 작성**

`letter/src/main/java/com/example/letter/config/SecurityConfig.java`:

```java
package com.example.letter.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/v1/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/v1/letters/share/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

- [ ] **Step 4: 기존 테스트 여전히 통과하는지 확인**

```bash
cd letter && ./gradlew test
```

Expected: 모든 기존 테스트 PASSED (AuthControllerTest 2개, JwtProviderTest 3개)

- [ ] **Step 5: Commit**

```bash
cd letter
git add src/main/java/com/example/letter/config/
git commit -m "feat: add CorsConfig (localhost:*), JwtAuthFilter, SecurityConfig"
```

---

## Task 7: Letter 엔티티 + Repository

**Files:**
- Create: `letter/src/main/java/com/example/letter/letter/Letter.java`
- Create: `letter/src/main/java/com/example/letter/letter/LetterRepository.java`

> `LetterNotFoundException`은 Task 2에서 이미 생성됨.

- [ ] **Step 1: Letter 엔티티 작성**

`letter/src/main/java/com/example/letter/letter/Letter.java`:

```java
package com.example.letter.letter;

import com.example.letter.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "letters")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Letter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 30)
    private String templateId;

    @Column(name = "to_name", nullable = false, length = 20)
    private String toName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "from_name", nullable = false, length = 20)
    private String fromName;

    @Column(nullable = false, unique = true, length = 12)
    private String shareToken;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime firstOpenedAt;

    public static Letter of(User user, String templateId,
                            String toName, String body,
                            String fromName, String shareToken) {
        Letter letter = new Letter();
        letter.user = user;
        letter.templateId = templateId;
        letter.toName = toName;
        letter.body = body;
        letter.fromName = fromName;
        letter.shareToken = shareToken;
        letter.createdAt = LocalDateTime.now();
        return letter;
    }

    public void markFirstOpen() {
        if (this.firstOpenedAt == null) {
            this.firstOpenedAt = LocalDateTime.now();
        }
    }
}
```

- [ ] **Step 2: LetterRepository 작성**

`letter/src/main/java/com/example/letter/letter/LetterRepository.java`:

```java
package com.example.letter.letter;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LetterRepository extends JpaRepository<Letter, Long> {
    Optional<Letter> findByShareToken(String shareToken);
}
```

- [ ] **Step 3: 컴파일 확인**

```bash
cd letter && ./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
cd letter
git add src/main/java/com/example/letter/letter/Letter.java \
        src/main/java/com/example/letter/letter/LetterRepository.java
git commit -m "feat: add Letter entity and LetterRepository"
```

---

## Task 8: LetterService

**Files:**
- Create: `letter/src/main/java/com/example/letter/letter/SendLetterRequest.java`
- Create: `letter/src/main/java/com/example/letter/letter/SendLetterResponse.java`
- Create: `letter/src/main/java/com/example/letter/letter/ReadLetterResponse.java`
- Create: `letter/src/main/java/com/example/letter/letter/LetterService.java`

- [ ] **Step 1: DTO 작성 — SendLetterRequest**

`letter/src/main/java/com/example/letter/letter/SendLetterRequest.java`:

```java
package com.example.letter.letter;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SendLetterRequest(
    @NotBlank String templateId,
    @NotBlank @Size(max = 20) String to,
    @NotBlank @Size(max = 2000) String body,
    @NotBlank @Size(max = 20) String from,
    List<Object> stickers
) {}
```

- [ ] **Step 2: DTO 작성 — SendLetterResponse**

`letter/src/main/java/com/example/letter/letter/SendLetterResponse.java`:

```java
package com.example.letter.letter;

public record SendLetterResponse(
    Long id,
    String shareToken,
    String shareUrl,
    String createdAt
) {}
```

- [ ] **Step 3: DTO 작성 — ReadLetterResponse**

`letter/src/main/java/com/example/letter/letter/ReadLetterResponse.java`:

```java
package com.example.letter.letter;

public record ReadLetterResponse(
    Long id,
    TemplateDto template,
    String to,
    String body,
    String from,
    String sentAt
) {
    public record TemplateDto(String id, String name, String imageUrl) {}
}
```

- [ ] **Step 4: LetterService 구현**

`letter/src/main/java/com/example/letter/letter/LetterService.java`:

```java
package com.example.letter.letter;

import com.example.letter.user.User;
import com.example.letter.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class LetterService {

    private final LetterRepository letterRepository;
    private final UserRepository userRepository;

    @Value("${culetter.base-url}")
    private String baseUrl;

    private static final Map<String, ReadLetterResponse.TemplateDto> TEMPLATES = Map.of(
        "tmpl_mint",       new ReadLetterResponse.TemplateDto("tmpl_mint",       "꽃비 민트",        "/images/편지지_꽃비_민트.png"),
        "tmpl_lavender",   new ReadLetterResponse.TemplateDto("tmpl_lavender",   "달빛 라벤더",      "/images/편지지_달빛_라벤더.png"),
        "tmpl_starpink",   new ReadLetterResponse.TemplateDto("tmpl_starpink",   "별하늘 핑크",      "/images/편지지_별하늘_핑크.png"),
        "tmpl_birthday",   new ReadLetterResponse.TemplateDto("tmpl_birthday",   "생일 축하해",      "/images/편지지1.png"),
        "tmpl_friendship", new ReadLetterResponse.TemplateDto("tmpl_friendship", "우리 우정 뽀에버", "/images/편지지2.png"),
        "tmpl_angel",      new ReadLetterResponse.TemplateDto("tmpl_angel",      "엔젤 봄이 와요",   "/images/편지지3.png")
    );

    public SendLetterResponse send(Long userId, SendLetterRequest req) {
        User user = userRepository.findById(userId).orElseThrow();
        String shareToken = UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        Letter letter = Letter.of(user, req.templateId(), req.to(), req.body(), req.from(), shareToken);
        letterRepository.save(letter);

        return new SendLetterResponse(
            letter.getId(),
            shareToken,
            baseUrl + "/letter/" + shareToken,
            letter.getCreatedAt().toString()
        );
    }

    public ReadLetterResponse read(String shareToken) {
        Letter letter = letterRepository.findByShareToken(shareToken)
            .orElseThrow(LetterNotFoundException::new);
        letter.markFirstOpen();

        ReadLetterResponse.TemplateDto tmpl = TEMPLATES.getOrDefault(
            letter.getTemplateId(),
            new ReadLetterResponse.TemplateDto(letter.getTemplateId(), letter.getTemplateId(), "/images/편지지1.png")
        );

        return new ReadLetterResponse(
            letter.getId(),
            tmpl,
            letter.getToName(),
            letter.getBody(),
            letter.getFromName(),
            letter.getCreatedAt().toString()
        );
    }
}
```

- [ ] **Step 5: 컴파일 확인**

```bash
cd letter && ./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 6: Commit**

```bash
cd letter
git add src/main/java/com/example/letter/letter/
git commit -m "feat: add LetterService with send/read logic and template imageUrl mapping"
```

---

## Task 9: LetterController + 통합 테스트

**Files:**
- Create: `letter/src/main/java/com/example/letter/letter/LetterController.java`
- Create: `letter/src/test/java/com/example/letter/letter/LetterControllerTest.java`

- [ ] **Step 1: 테스트 작성**

`letter/src/test/java/com/example/letter/letter/LetterControllerTest.java`:

```java
package com.example.letter.letter;

import com.example.letter.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class LetterControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @Autowired UserRepository userRepository;
    @Autowired LetterRepository letterRepository;

    private String accessToken;

    @BeforeEach
    void setUp() throws Exception {
        letterRepository.deleteAll();
        userRepository.deleteAll();

        MvcResult loginResult = mvc.perform(get("/v1/auth/kakao/callback").param("code", "mock"))
            .andReturn();
        accessToken = om.readTree(loginResult.getResponse().getContentAsString())
            .path("data").path("accessToken").asText();
    }

    @Test
    void 편지_발송_성공() throws Exception {
        Map<String, Object> req = Map.of(
            "templateId", "tmpl_mint",
            "to", "지은이",
            "body", "오늘 하루도 고생 많았어",
            "from", "연우",
            "stickers", List.of()
        );

        mvc.perform(post("/v1/letters")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.ok").value(true))
            .andExpect(jsonPath("$.data.shareToken").isNotEmpty())
            .andExpect(jsonPath("$.data.shareUrl").isNotEmpty());
    }

    @Test
    void 인증없이_편지_발송시_401() throws Exception {
        Map<String, Object> req = Map.of(
            "templateId", "tmpl_mint",
            "to", "지은이",
            "body", "내용",
            "from", "연우",
            "stickers", List.of()
        );

        mvc.perform(post("/v1/letters")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void 편지_열람_성공() throws Exception {
        // 편지 먼저 발송
        Map<String, Object> sendReq = Map.of(
            "templateId", "tmpl_mint",
            "to", "지은이",
            "body", "오늘 하루도 고생 많았어",
            "from", "연우",
            "stickers", List.of()
        );
        MvcResult sendResult = mvc.perform(post("/v1/letters")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(sendReq)))
            .andReturn();

        String shareToken = om.readTree(sendResult.getResponse().getContentAsString())
            .path("data").path("shareToken").asText();

        // 공유 링크로 열람 (인증 불필요)
        mvc.perform(get("/v1/letters/share/" + shareToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.ok").value(true))
            .andExpect(jsonPath("$.data.body").value("오늘 하루도 고생 많았어"))
            .andExpect(jsonPath("$.data.template.id").value("tmpl_mint"));
    }

    @Test
    void 없는_shareToken_404() throws Exception {
        mvc.perform(get("/v1/letters/share/notexist"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.ok").value(false))
            .andExpect(jsonPath("$.error.code").value("LETTER_NOT_FOUND"));
    }
}
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd letter && ./gradlew test --tests "com.example.letter.letter.LetterControllerTest" 2>&1 | tail -20
```

Expected: FAILED — LetterController not found

- [ ] **Step 3: LetterController 구현**

`letter/src/main/java/com/example/letter/letter/LetterController.java`:

```java
package com.example.letter.letter;

import com.example.letter.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/letters")
@RequiredArgsConstructor
public class LetterController {

    private final LetterService letterService;

    @PostMapping
    public ApiResponse<SendLetterResponse> send(
        @AuthenticationPrincipal Long userId,
        @Valid @RequestBody SendLetterRequest req
    ) {
        return ApiResponse.ok(letterService.send(userId, req));
    }

    @GetMapping("/share/{shareToken}")
    public ApiResponse<ReadLetterResponse> read(@PathVariable String shareToken) {
        return ApiResponse.ok(letterService.read(shareToken));
    }
}
```

- [ ] **Step 4: 전체 테스트 통과 확인**

```bash
cd letter && ./gradlew test
```

Expected: 모든 테스트 PASSED (AuthControllerTest 2, JwtProviderTest 3, LetterControllerTest 4)

- [ ] **Step 5: 서버 실제 실행 확인**

```bash
cd letter && ./gradlew bootRun &
sleep 5
curl -s "http://localhost:8080/v1/auth/kakao/callback?code=mock" | python3 -m json.tool
```

Expected: `{ "ok": true, "data": { "accessToken": "eyJ...", ... } }`

- [ ] **Step 6: Commit**

```bash
cd letter
kill %1  # bootRun 종료
git add src/main/java/com/example/letter/letter/LetterController.java \
        src/test/java/com/example/letter/letter/LetterControllerTest.java
git commit -m "feat: add LetterController — POST /v1/letters and GET /v1/letters/share/{token}"
```

---

## Task 10: 프론트엔드 API 클라이언트 설정

**Files:**
- Create: `culetter-react/.env.local`
- Create: `culetter-react/src/api/client.ts`

- [ ] **Step 1: .env.local 생성**

`culetter-react/.env.local`:

```
VITE_API_BASE=http://localhost:8080/v1
```

- [ ] **Step 2: api/client.ts 작성**

`culetter-react/src/api/client.ts`:

```typescript
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
  mockLogin: () =>
    request<LoginData>('/auth/kakao/callback?code=mock'),

  sendLetter: (payload: { templateId: string; to: string; body: string; from: string; stickers: object[] }) =>
    request<SendLetterData>('/letters', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getLetter: (shareToken: string) =>
    request<LetterData>(`/letters/share/${shareToken}`),
}
```

- [ ] **Step 3: 타입 체크 확인**

```bash
cd culetter-react && npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: Commit**

```bash
cd culetter-react
git add .env.local src/api/client.ts
git commit -m "feat: add API client with mock login, sendLetter, getLetter"
```

---

## Task 11: Login.tsx — Mock 로그인 연동

**Files:**
- Modify: `culetter-react/src/pages/Login.tsx`

- [ ] **Step 1: Login.tsx 수정**

`culetter-react/src/pages/Login.tsx`의 카카오 버튼 onClick 부분을 수정:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { LOGO_SVG } from '../data'
import { api } from '../api/client'
import { useToast } from '../hooks/useToast'

export default function Login() {
  const navigate = useNavigate()
  const { show } = useToast()
  const [loading, setLoading] = useState(false)

  const handleKakaoLogin = async () => {
    setLoading(true)
    try {
      const data = await api.mockLogin()
      localStorage.setItem('culetter_access_token', data.accessToken)
      localStorage.setItem('culetter_refresh_token', data.refreshToken)
      navigate('/select')
    } catch {
      show('로그인에 실패했어요 😢')
    } finally {
      setLoading(false)
    }
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

- [ ] **Step 2: 타입 체크**

```bash
cd culetter-react && npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: Commit**

```bash
cd culetter-react
git add src/pages/Login.tsx
git commit -m "feat: wire Login page to mock Kakao login API, store JWT in localStorage"
```

---

## Task 12: Write.tsx — 편지 발송 API 연동

**Files:**
- Modify: `culetter-react/src/pages/Write.tsx`

- [ ] **Step 1: Write.tsx의 sendLetter 함수 교체**

`culetter-react/src/pages/Write.tsx`의 `sendLetter` 함수를 아래로 교체:

```tsx
// 파일 상단 import에 추가
import { api } from '../api/client'

// sendLetter 함수 전체 교체 (기존 함수 삭제 후 아래로 대체)
const sendLetter = async () => {
  if (!body.trim()) {
    show('편지 내용을 먼저 작성해 주세요 ✏️')
    return
  }
  setLoading(true)
  try {
    const data = await api.sendLetter({
      templateId: paperId,
      to: to.trim() || '받는 사람',
      body: body.trim(),
      from: from.trim() || '보내는 사람',
      stickers: [],
    })
    navigate(`/send?t=${data.shareToken}`)
  } catch {
    show('편지 전송에 실패했어요 😢')
  } finally {
    setLoading(false)
  }
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd culetter-react && npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: Commit**

```bash
cd culetter-react
git add src/pages/Write.tsx
git commit -m "feat: wire Write page to POST /letters API, use real shareToken for navigation"
```

---

## Task 13: Read.tsx — 편지 열람 API 연동

**Files:**
- Modify: `culetter-react/src/pages/Read.tsx`

- [ ] **Step 1: Read.tsx 전체 교체**

`culetter-react/src/pages/Read.tsx`를 아래로 교체:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SAMPLE_LETTER } from '../data'
import { api } from '../api/client'

type LetterState = {
  to: string
  body: string
  from: string
  bgSrc?: string
}

export default function Read() {
  const navigate = useNavigate()
  const { token } = useParams<{ token: string }>()
  const [opened, setOpened] = useState(false)
  const [letter, setLetter] = useState<LetterState | null>(null)

  useEffect(() => {
    setOpened(false)

    if (token) {
      api.getLetter(token)
        .then(data => setLetter({
          to: data.to,
          body: data.body,
          from: data.from,
          bgSrc: data.template.imageUrl,
        }))
        .catch(() => setLetter(fallbackFromSession()))
    } else {
      setLetter(fallbackFromSession())
    }
  }, [token])

  const toName   = letter?.to   || '소중한 당신'
  const fromName = letter?.from || '연우'
  const body     = letter?.body || SAMPLE_LETTER

  return (
    <section className={`page active${opened ? ' opened' : ''}`} id="page-read">
      <main className="read-main">
        <span className="read-particle" style={{ left: '10%', top: '72%', animationDelay: '0s',   fontSize: 16 }}>☘️</span>
        <span className="read-particle" style={{ left: '86%', top: '66%', animationDelay: '1.4s', fontSize: 12 }}>✨</span>
        <span className="read-particle" style={{ left: '20%', top: '45%', animationDelay: '2.8s', fontSize: 13 }}>🌿</span>
        <span className="read-particle" style={{ left: '78%', top: '28%', animationDelay: '4s',   fontSize: 12 }}>✨</span>
        <span className="read-particle" style={{ left: '14%', top: '18%', animationDelay: '3.2s', fontSize: 14 }}>☘️</span>
        <span className="read-particle" style={{ left: '90%', top: '40%', animationDelay: '5.4s', fontSize: 11 }}>✨</span>

        <div className={`read-intro${opened ? ' hidden' : ''}`}>
          <div className="read-intro-kicker">
            <span>💌</span><span>편지가 도착했어요</span>
          </div>
          <h1 className="read-intro-title">소중한 마음이 담긴 편지예요</h1>
          <p className="read-intro-hint">봉투를 눌러서 열어보세요</p>
        </div>

        <div className="envelope-stage">
          <div className="envelope" onClick={() => setOpened(true)}>
            <div className="env-back"></div>
            <div className="env-letter"></div>
            <div className="env-front"></div>
            <div className="env-flap">
              <div className="wax-seal">C</div>
            </div>
          </div>
        </div>

        <article className="reveal-letter">
          <p className="letter-greeting">To. {toName}에게 💚</p>
          <p className="letter-body">{body}</p>
          <div className="letter-divider"></div>
          <p className="letter-signature">From. {fromName}</p>
        </article>

        <div className="read-actions">
          <button className="read-btn read-btn-outline" onClick={() => setOpened(false)}>다시 열어보기</button>
          <button className="read-btn read-btn-solid" onClick={() => navigate('/')}>처음으로</button>
        </div>
      </main>
    </section>
  )
}

function fallbackFromSession(): LetterState {
  try {
    const raw = sessionStorage.getItem('culetter_composed')
    const composed = raw ? JSON.parse(raw) : null
    return {
      to:   composed?.to   || '소중한 당신',
      body: composed?.body || SAMPLE_LETTER,
      from: composed?.from || '연우',
      bgSrc: composed?.bgSrc,
    }
  } catch {
    return { to: '소중한 당신', body: SAMPLE_LETTER, from: '연우' }
  }
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd culetter-react && npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 전체 플로우 수동 검증**

백엔드와 프론트 모두 실행:

```bash
# 터미널 1
cd letter && ./gradlew bootRun

# 터미널 2
cd culetter-react && npm run dev
```

브라우저에서 `http://localhost:5173` 접속 후:
1. 홈 → "편지 쓰러 가기" 클릭
2. /login 에서 카카오 버튼 클릭 → localStorage에 `culetter_access_token` 저장 확인
3. 편지지 선택 → 편지 작성 → 완료 클릭
4. /send 페이지에서 실제 shareToken URL 확인 (`Culetter.com/letter/xxx` 12자 토큰)
5. shareToken으로 `/letter/{token}` 직접 접속 → 편지 열람 확인

- [ ] **Step 4: Commit**

```bash
cd culetter-react
git add src/pages/Read.tsx
git commit -m "feat: wire Read page to GET /letters/share/{token} API with session fallback"
```

---

## 완료 기준

- [ ] `./gradlew test` — 9개 테스트 모두 PASSED
- [ ] 백엔드 서버 실행 후 `curl /v1/auth/kakao/callback?code=mock` → 200 OK + accessToken
- [ ] 로그인 → 편지 작성 → 발송 → shareToken URL로 열람 전체 플로우 동작
- [ ] 없는 shareToken 요청 시 404 응답
- [ ] 인증 없이 `POST /v1/letters` 요청 시 401 응답
- [ ] 프론트 `npx tsc --noEmit` 오류 없음
