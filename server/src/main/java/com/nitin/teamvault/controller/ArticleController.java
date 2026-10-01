package com.nitin.teamvault.controller;

import com.nitin.teamvault.dto.ArticleRequest;
import com.nitin.teamvault.dto.ArticleResponse;
import com.nitin.teamvault.dto.ArticleVersionResponse;
import com.nitin.teamvault.entity.User;
import com.nitin.teamvault.service.ArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;

    // Articles are created inside a specific project
    @PostMapping("/projects/{projectId}/articles")
    public ResponseEntity<ArticleResponse> createArticle(
            @PathVariable Long projectId,
            @Valid @RequestBody ArticleRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return new ResponseEntity<>(articleService.createArticle(projectId, request, currentUser), HttpStatus.CREATED);
    }

    // Get all articles for a project
    @GetMapping("/projects/{projectId}/articles")
    public ResponseEntity<List<ArticleResponse>> getArticlesByProject(
            @PathVariable Long projectId,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(articleService.getArticlesByProject(projectId, currentUser));
    }

    // Get a specific article by its ID
    @GetMapping("/articles/{id}")
    public ResponseEntity<ArticleResponse> getArticleById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(articleService.getArticleById(id, currentUser));
    }

    // Update an article
    @PutMapping("/articles/{id}")
    public ResponseEntity<ArticleResponse> updateArticle(
            @PathVariable Long id,
            @Valid @RequestBody ArticleRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(articleService.updateArticle(id, request, currentUser));
    }

    // Delete an article
    @DeleteMapping("/articles/{id}")
    public ResponseEntity<Void> deleteArticle(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        articleService.deleteArticle(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    // Get version history list of an article
    @GetMapping("/articles/{id}/versions")
    public ResponseEntity<List<ArticleVersionResponse>> getArticleVersions(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(articleService.getArticleVersions(id, currentUser));
    }

    // Get a specific version of an article
    @GetMapping("/articles/{id}/versions/{versionNumber}")
    public ResponseEntity<ArticleVersionResponse> getArticleVersion(
            @PathVariable Long id,
            @PathVariable Integer versionNumber,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(articleService.getArticleVersion(id, versionNumber, currentUser));
    }

    // Restore an article to a specific version
    @PostMapping("/articles/{id}/versions/{versionNumber}/restore")
    public ResponseEntity<ArticleResponse> restoreArticleVersion(
            @PathVariable Long id,
            @PathVariable Integer versionNumber,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(articleService.restoreArticleVersion(id, versionNumber, currentUser));
    }
}
