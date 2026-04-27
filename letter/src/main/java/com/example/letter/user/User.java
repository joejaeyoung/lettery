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

    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }
}
