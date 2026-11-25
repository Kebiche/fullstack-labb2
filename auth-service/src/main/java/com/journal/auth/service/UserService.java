package com.journal.auth.service;

import com.journal.auth.dto.LoginRequest;
import com.journal.auth.dto.RegisterRequest;
import com.journal.auth.dto.UserResponse;
import com.journal.auth.entity.User;
import com.journal.auth.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Användarnamnet finns redan");
        }
        String hash = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getUsername(), hash, request.getRole());
        user = userRepository.save(user);
        return new UserResponse(user.getId(), user.getUsername(), user.getRole());
    }

    public UserResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Fel användarnamn eller lösenord"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Fel användarnamn eller lösenord");
        }
        return new UserResponse(user.getId(), user.getUsername(), user.getRole());
    }

    public UserResponse getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Användaren hittades inte"));
        return new UserResponse(user.getId(), user.getUsername(), user.getRole());
    }
}