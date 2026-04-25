package com.example.letter.letter;

import com.example.letter.user.UserRepository;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
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
