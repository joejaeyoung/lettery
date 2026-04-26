package com.example.letter.auth;

import com.example.letter.user.User;
import com.example.letter.user.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
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

        User user;
        try {
            user = userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(User.of(nickname, email)));
        } catch (DataIntegrityViolationException ex) {
            user = userRepository.findByEmail(email).orElseThrow(() -> ex);
        }

        return new LoginResult(
            jwtProvider.generateAccessToken(user.getId()),
            jwtProvider.generateRefreshToken(user.getId()),
            user.getId(),
            user.getNickname(),
            user.getEmail()
        );
    }

    @Transactional
    LoginResult mockLogin() {
        User user;
        try {
            user = userRepository.findByEmail("mock@culetter.com")
                .orElseGet(() -> userRepository.save(User.of("연우", "mock@culetter.com")));
        } catch (DataIntegrityViolationException ex) {
            user = userRepository.findByEmail("mock@culetter.com").orElseThrow(() -> ex);
        }

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
