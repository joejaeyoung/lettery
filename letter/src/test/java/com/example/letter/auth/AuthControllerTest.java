package com.example.letter.auth;

import com.example.letter.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
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
    }
}
