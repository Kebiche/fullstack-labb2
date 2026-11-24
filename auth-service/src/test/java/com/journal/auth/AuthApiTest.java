package com.journal.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.journal.auth.entity.User;
import com.journal.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:h2:mem:auth-test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class AuthApiTest {
    @Autowired
    private TestRestTemplate http;
    @Autowired
    private UserRepository users;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void clearUsers() {
        http.getRestTemplate().setRequestFactory(new JdkClientHttpRequestFactory());
        users.deleteAll();
    }

    @Test
    void registerLoginAndFetchUser() {
        var registration = register("Test.Patient", "PATIENT");
        assertThat(registration.getStatusCode().value()).isEqualTo(201);
        JsonNode profile = registration.getBody();
        assertThat(profile.get("username").asText()).isEqualTo("test.patient");
        assertThat(profile.get("role").asText()).isEqualTo("PATIENT");
        assertThat(profile.has("password")).isFalse();
        assertThat(profile.has("passwordHash")).isFalse();

        User stored = users.findByUsername("test.patient").orElseThrow();
        assertThat(stored.getPasswordHash()).isNotEqualTo("TestPassword123!");
        assertThat(passwordEncoder.matches("TestPassword123!", stored.getPasswordHash())).isTrue();

        var login = login(" TEST.PATIENT ", "TestPassword123!");
        assertThat(login.getStatusCode().value()).isEqualTo(200);
        assertThat(login.getBody()).isEqualTo(profile);

        var fetched = http.getForEntity("/api/auth/users/" + stored.getId(), JsonNode.class);
        assertThat(fetched.getStatusCode().value()).isEqualTo(200);
        assertThat(fetched.getBody()).isEqualTo(profile);
    }

    @Test
    void supportsBothStaffRoles() {
        assertThat(register("doctor", "DOCTOR").getStatusCode().value()).isEqualTo(201);
        assertThat(register("staff", "PRACTITIONER").getStatusCode().value()).isEqualTo(201);
        assertThat(login("doctor", "TestPassword123!").getBody().get("role").asText()).isEqualTo("DOCTOR");
    }

    @Test
    void rejectsDuplicateUsernameIgnoringCase() {
        register("patient", "PATIENT");
        assertThat(register("PATIENT", "PATIENT").getStatusCode().value()).isEqualTo(409);
        assertThat(users.count()).isEqualTo(1);
    }

    @Test
    void handlesConcurrentRegistrationOfSameUsername() {
        var first = CompletableFuture.supplyAsync(() -> register("same.patient", "PATIENT"));
        var second = CompletableFuture.supplyAsync(() -> register("same.patient", "PATIENT"));
        assertThat(new int[]{first.join().getStatusCode().value(), second.join().getStatusCode().value()})
                .containsExactlyInAnyOrder(201, 409);
        assertThat(users.count()).isEqualTo(1);
    }

    @Test
    void rejectsWrongPasswordAndUnknownUsername() {
        register("patient", "PATIENT");
        var wrongPassword = login("patient", "WrongPassword123!");
        var unknownUser = login("unknown", "TestPassword123!");
        assertThat(wrongPassword.getStatusCode().value()).isEqualTo(401);
        assertThat(unknownUser.getStatusCode().value()).isEqualTo(401);
        assertThat(unknownUser.getBody()).isEqualTo(wrongPassword.getBody());
    }

    @Test
    void validatesRegistrationInput() {
        List<Map<String, String>> invalidRequests = List.of(
                Map.of("username", "", "password", "TestPassword123!", "role", "PATIENT"),
                Map.of("username", "with space", "password", "TestPassword123!", "role", "PATIENT"),
                Map.of("username", "patient", "password", "short", "role", "PATIENT"),
                Map.of("username", "patient", "password", "TestPassword123!", "role", "ADMIN"),
                Map.of("username", "patient", "password", "TestPassword123!")
        );
        for (var request : invalidRequests) {
            var result = http.postForEntity("/api/auth/register", request, JsonNode.class);
            assertThat(result.getStatusCode().value()).isEqualTo(400);
        }
        assertThat(users.count()).isZero();
    }

    @Test
    void rejectsPasswordsAboveBcryptByteLimit() {
        var request = Map.of("username", "patient", "password", "å".repeat(37), "role", "PATIENT");
        assertThat(http.postForEntity("/api/auth/register", request, JsonNode.class)
                .getStatusCode().value()).isEqualTo(400);
        assertThat(users.count()).isZero();
    }

    @Test
    void rejectsMalformedUserIdsAndReturnsNotFoundForMissingUsers() {
        assertThat(http.getForEntity("/api/auth/users/unknown", JsonNode.class)
                .getStatusCode().value()).isEqualTo(400);
        assertThat(http.getForEntity("/api/auth/users/999999", JsonNode.class)
                .getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void rejectsExtraBytesAfterMaximumLengthPassword() {
        String password = "å".repeat(36);
        var request = Map.of("username", "patient", "password", password, "role", "PATIENT");
        assertThat(http.postForEntity("/api/auth/register", request, JsonNode.class)
                .getStatusCode().value()).isEqualTo(201);
        assertThat(login("patient", password).getStatusCode().value()).isEqualTo(200);
        assertThat(login("patient", password + "a").getStatusCode().value()).isEqualTo(401);
    }

    private ResponseEntity<JsonNode> register(String username, String role) {
        return http.postForEntity("/api/auth/register",
                Map.of("username", username, "password", "TestPassword123!", "role", role), JsonNode.class);
    }

    private ResponseEntity<JsonNode> login(String username, String password) {
        return http.postForEntity("/api/auth/login",
                Map.of("username", username, "password", password), JsonNode.class);
    }
}
