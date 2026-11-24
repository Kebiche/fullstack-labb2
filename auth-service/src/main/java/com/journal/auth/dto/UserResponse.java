package com.journal.auth.dto;

import com.journal.auth.entity.Role;
import com.journal.auth.entity.User;

public record UserResponse(Long id, String username, Role role) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getRole());
    }
}
