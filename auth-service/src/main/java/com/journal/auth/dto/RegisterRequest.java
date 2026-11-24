package com.journal.auth.dto;

import com.journal.auth.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 100)
        @Pattern(regexp = "[a-zA-Z0-9._@+-]+") String username,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotNull Role role) {
}
