package com.example.letter.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Component
public class KakaoAuthClient {

    private static final String TOKEN_URL = "https://kauth.kakao.com/oauth/token";
    private static final String USER_URL  = "https://kapi.kakao.com/v2/user/me";

    private final String clientId;
    private final String redirectUri;
    private final RestClient restClient;

    public KakaoAuthClient(
        @Value("${culetter.kakao.client-id}") String clientId,
        @Value("${culetter.kakao.redirect-uri}") String redirectUri
    ) {
        this.clientId    = clientId;
        this.redirectUri = redirectUri;
        this.restClient  = RestClient.create();
    }

    public KakaoTokenResponse getToken(String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type",   "authorization_code");
        form.add("client_id",    clientId);
        form.add("redirect_uri", redirectUri);
        form.add("code",         code);

        return restClient.post()
            .uri(TOKEN_URL)
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(form)
            .retrieve()
            .onStatus(status -> status.is4xxClientError(),
                (req, res) -> { throw new KakaoAuthException("카카오 토큰 발급 실패"); })
            .body(KakaoTokenResponse.class);
    }

    public KakaoUserResponse getUserInfo(String kakaoAccessToken) {
        return restClient.get()
            .uri(USER_URL)
            .header("Authorization", "Bearer " + kakaoAccessToken)
            .retrieve()
            .onStatus(status -> status.is4xxClientError(),
                (req, res) -> { throw new KakaoAuthException("카카오 유저 정보 조회 실패"); })
            .body(KakaoUserResponse.class);
    }
}
