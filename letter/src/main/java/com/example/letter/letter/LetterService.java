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
