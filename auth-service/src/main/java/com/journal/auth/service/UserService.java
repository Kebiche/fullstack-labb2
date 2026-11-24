package com.journal.auth.service;

import com.journal.auth.dto.LoginRequest;
import com.journal.auth.dto.RegisterRequest;
import com.journal.auth.dto.UserResponse;
import com.journal.auth.entity.User;
import com.journal.auth.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class UserService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final String dummyPasswordHash;

    public UserService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        // Unknown usernames still perform a password check.
        this.dummyPasswordHash = passwordEncoder.encode("unused-login-password");
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String username = normalizeUsername(request.username());
        if (users.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Användarnamnet används redan.");
        }
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lösenordet får vara högst 72 byte.");
        }

        String passwordHash = passwordEncoder.encode(request.password());
        User user = new User(username, passwordHash, request.role());
        return UserResponse.from(users.saveAndFlush(user));
    }

    public UserResponse login(LoginRequest request) {
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Fel användarnamn eller lösenord.");
        }
        User user = users.findByUsername(normalizeUsername(request.username())).orElse(null);
        String passwordHash = user == null ? dummyPasswordHash : user.getPasswordHash();
        boolean passwordMatches = passwordEncoder.matches(request.password(), passwordHash);
        if (user == null || !passwordMatches) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Fel användarnamn eller lösenord.");
        }
        return UserResponse.from(user);
    }

    public UserResponse getUser(Long id) {
        User user = users.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Användaren hittades inte."));
        return UserResponse.from(user);
    }

    private String normalizeUsername(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }
}
