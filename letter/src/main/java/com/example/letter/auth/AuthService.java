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
