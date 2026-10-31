package com.nitin.teamvault;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@Import(TeamVaultApiIntegrationTest.EmailCaptureConfig.class)
class TeamVaultApiIntegrationTest {

    @TestConfiguration
    static class EmailCaptureConfig {
        @Bean
        @Primary
        RecordingEmailSender recordingEmailSender() {
            return new RecordingEmailSender();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecordingEmailSender emailSender;

    @Test
    void authProfileAndProjectFlow() throws Exception {
        String token = register("Alice", "alice@example.com");

        // Duplicate registration must be a clean 409, not a 500.
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("Alice Again", "alice@example.com")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("An account with this email already exists"));

        // Missing and malformed credentials must be 401.
        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/projects").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/users/me").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alice"))
                .andExpect(jsonPath("$.email").value("alice@example.com"));

        long projectId = createProject(token, "Backend Docs", "Initial description");

        mockMvc.perform(put("/api/projects/" + projectId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Renamed Docs\",\"description\":\"Updated\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed Docs"))
                .andExpect(jsonPath("$.description").value("Updated"));
    }

    @Test
    void rbacAndArticleVersioningFlow() throws Exception {
        String ownerToken = register("Owner", "owner@example.com");
        String viewerToken = register("Viewer", "viewer@example.com");
        long projectId = createProject(ownerToken, "Project", "Description");

        // A non-member cannot even see the project.
        mockMvc.perform(get("/api/projects/" + projectId).header("Authorization", bearer(viewerToken)))
                .andExpect(status().isForbidden());

        // The OWNER role cannot be assigned through an invite.
        mockMvc.perform(post("/api/projects/" + projectId + "/members")
                        .header("Authorization", bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"viewer@example.com\",\"role\":\"OWNER\"}"))
                .andExpect(status().isBadRequest());

        MvcResult addMemberResult = mockMvc.perform(post("/api/projects/" + projectId + "/members")
                        .header("Authorization", bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"viewer@example.com\",\"role\":\"VIEWER\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("VIEWER"))
                .andReturn();

        Number viewerId = JsonPath.read(addMemberResult.getResponse().getContentAsString(), "$.userId");

        mockMvc.perform(get("/api/projects/" + projectId).header("Authorization", bearer(viewerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentUserRole").value("VIEWER"));

        mockMvc.perform(post("/api/projects/" + projectId + "/articles")
                        .header("Authorization", bearer(viewerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleBody("Viewer attempt", "Nope")))
                .andExpect(status().isForbidden());

        long articleId = createArticle(ownerToken, projectId, "Setup Guide", "v1 content");

        mockMvc.perform(get("/api/articles/" + articleId + "/versions")
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].versionNumber").value(1))
                .andExpect(jsonPath("$[0].content").value("v1 content"));

        mockMvc.perform(put("/api/articles/" + articleId)
                        .header("Authorization", bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleBody("Setup Guide", "v2 content")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("v2 content"));

        mockMvc.perform(get("/api/articles/" + articleId + "/versions")
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].versionNumber").value(2))
                .andExpect(jsonPath("$[1].versionNumber").value(1));

        mockMvc.perform(post("/api/articles/" + articleId + "/versions/1/restore")
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("v1 content"));

        mockMvc.perform(get("/api/articles/" + articleId + "/versions")
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].versionNumber").value(3));

        // Viewers can read history but cannot restore it.
        mockMvc.perform(post("/api/articles/" + articleId + "/versions/1/restore")
                        .header("Authorization", bearer(viewerToken)))
                .andExpect(status().isForbidden());

        // Members list includes the implicit owner first.
        mockMvc.perform(get("/api/projects/" + projectId + "/members")
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].role").value("OWNER"));

        mockMvc.perform(delete("/api/projects/" + projectId + "/members/" + viewerId)
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/projects/" + projectId).header("Authorization", bearer(viewerToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void editorCanCreateArticlesButCannotDeleteProject() throws Exception {
        String ownerToken = register("Owner", "owner@example.com");
        String editorToken = register("Editor", "editor@example.com");
        long projectId = createProject(ownerToken, "Project", "Description");

        mockMvc.perform(post("/api/projects/" + projectId + "/members")
                        .header("Authorization", bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"editor@example.com\",\"role\":\"EDITOR\"}"))
                .andExpect(status().isCreated());

        createArticle(editorToken, projectId, "Editor Article", "Editor content");

        mockMvc.perform(delete("/api/projects/" + projectId)
                        .header("Authorization", bearer(editorToken)))
                .andExpect(status().isForbidden());
    }

    private String register(String name, String email) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(name, email)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.requiresEmailVerification").value(true));

        String code = emailSender.lastCodeFor(email);
        assertNotNull(code, "A verification code should have been sent");

        MvcResult result = mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"" + code + "\"}"))
                .andExpect(status().isOk())
                .andReturn();

        return JsonPath.read(result.getResponse().getContentAsString(), "$.token");
    }

    @Test
    void emailVerificationFlow() throws Exception {
        String email = "newuser@example.com";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("New User", email)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.requiresEmailVerification").value(true))
                .andExpect(jsonPath("$.token").doesNotExist());

        String code = emailSender.lastCodeFor(email);
        assertNotNull(code);
        assertEquals(6, code.length());

        // Sign-in is blocked until the address is verified.
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("EMAIL_NOT_VERIFIED"));

        // A second code cannot be requested within the cooldown window.
        mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isTooManyRequests());

        // Unknown emails get the same generic response (no account enumeration).
        mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"missing@example.com\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"000000\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid or expired verification code"));

        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"" + code + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

        // The code is single-use.
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"" + code + "\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    private long createProject(String token, String name, String description) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/projects")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"description\":\"" + description + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();

        Number id = JsonPath.read(result.getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }

    private long createArticle(String token, long projectId, String title, String content) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/projects/" + projectId + "/articles")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleBody(title, content)))
                .andExpect(status().isCreated())
                .andReturn();

        Number id = JsonPath.read(result.getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }

    private String registerBody(String name, String email) {
        return "{\"name\":\"" + name + "\",\"email\":\"" + email + "\",\"password\":\"password123\"}";
    }

    private String articleBody(String title, String content) {
        return "{\"title\":\"" + title + "\",\"content\":\"" + content + "\"}";
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
