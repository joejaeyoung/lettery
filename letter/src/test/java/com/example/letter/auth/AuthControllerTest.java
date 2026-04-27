package com.example.letter.auth;

import com.example.letter.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
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

        assertThat(userRepository.count()).isEqualTo(1L);
    }

    @Test
    void kakaoLogin_잘못된코드_401() throws Exception {
        given(kakaoAuthClient.getToken("bad-code"))
            .willThrow(new KakaoAuthException("카카오 토큰 발급 실패 [400]"));

        mvc.perform(get("/v1/auth/kakao/callback").param("code", "bad-code"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.ok").value(false))
            .andExpect(jsonPath("$.error.code").value("KAKAO_AUTH_FAILED"));
    }
}
