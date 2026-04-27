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
