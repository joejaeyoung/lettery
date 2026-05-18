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
