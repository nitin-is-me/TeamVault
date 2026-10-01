package com.nitin.teamvault.service;

import com.nitin.teamvault.dto.ArticleRequest;
import com.nitin.teamvault.dto.ArticleResponse;
import com.nitin.teamvault.dto.ArticleVersionResponse;
import com.nitin.teamvault.entity.Article;
import com.nitin.teamvault.entity.ArticleVersion;
import com.nitin.teamvault.entity.Project;
import com.nitin.teamvault.entity.User;
import com.nitin.teamvault.repository.ArticleRepository;
import com.nitin.teamvault.repository.ArticleVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final ArticleVersionRepository articleVersionRepository;
    private final ProjectService projectService;

    @Transactional
    public ArticleResponse createArticle(Long projectId, ArticleRequest request, User currentUser) {
        Project project = projectService.getProjectIfAccessible(projectId, currentUser);
        String role = projectService.getRoleForProject(project, currentUser);
        if ("VIEWER".equals(role)) {
            throw new RuntimeException("You do not have permission to create articles in this project");
        }

        Article article = Article.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .project(project)
                .author(currentUser)
                .build();

        Article savedArticle = articleRepository.save(article);

        // Record initial version 1
        ArticleVersion initialVersion = ArticleVersion.builder()
                .article(savedArticle)
                .versionNumber(1)
                .title(savedArticle.getTitle())
                .content(savedArticle.getContent())
                .author(currentUser)
                .build();
        articleVersionRepository.save(initialVersion);

        return mapToResponse(savedArticle);
    }

    public List<ArticleResponse> getArticlesByProject(Long projectId, User currentUser) {
        projectService.getProjectIfAccessible(projectId, currentUser); // verify access
        return articleRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ArticleResponse getArticleById(Long id, User currentUser) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found with id: " + id));
        projectService.getProjectIfAccessible(article.getProject().getId(), currentUser); // verify access
        return mapToResponse(article);
    }

    @Transactional
    public ArticleResponse updateArticle(Long id, ArticleRequest request, User currentUser) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found with id: " + id));

        Project project = projectService.getProjectIfAccessible(article.getProject().getId(), currentUser); // verify access
        String role = projectService.getRoleForProject(project, currentUser);
        
        if ("VIEWER".equals(role)) {
            throw new RuntimeException("You do not have permission to edit articles in this project");
        }

        // Determine next version number
        Optional<ArticleVersion> latestOpt = articleVersionRepository.findTopByArticleIdOrderByVersionNumberDesc(article.getId());
        int nextVersion;
        if (latestOpt.isEmpty()) {
            // Legacy article backwards compatibility: snapshot previous state as v1
            ArticleVersion legacyV1 = ArticleVersion.builder()
                    .article(article)
                    .versionNumber(1)
                    .title(article.getTitle())
                    .content(article.getContent())
                    .author(article.getAuthor())
                    .createdAt(article.getCreatedAt())
                    .build();
            articleVersionRepository.save(legacyV1);
            nextVersion = 2;
        } else {
            nextVersion = latestOpt.get().getVersionNumber() + 1;
        }

        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        Article updatedArticle = articleRepository.save(article);

        // Record new version snapshot
        ArticleVersion newVersion = ArticleVersion.builder()
                .article(updatedArticle)
                .versionNumber(nextVersion)
                .title(request.getTitle())
                .content(request.getContent())
                .author(currentUser)
                .build();
        articleVersionRepository.save(newVersion);

        return mapToResponse(updatedArticle);
    }

    @Transactional
    public void deleteArticle(Long id, User currentUser) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found with id: " + id));

        Project project = projectService.getProjectIfAccessible(article.getProject().getId(), currentUser); // verify access
        String role = projectService.getRoleForProject(project, currentUser);

        if ("VIEWER".equals(role)) {
            throw new RuntimeException("You do not have permission to delete articles in this project");
        }

        articleRepository.delete(article);
    }

    public List<ArticleVersionResponse> getArticleVersions(Long articleId, User currentUser) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found with id: " + articleId));
        projectService.getProjectIfAccessible(article.getProject().getId(), currentUser);

        List<ArticleVersion> versions = articleVersionRepository.findByArticleIdOrderByVersionNumberDesc(articleId);
        if (versions.isEmpty()) {
            // Lazy migration for legacy articles
            ArticleVersion v1 = ArticleVersion.builder()
                    .article(article)
                    .versionNumber(1)
                    .title(article.getTitle())
                    .content(article.getContent())
                    .author(article.getAuthor())
                    .createdAt(article.getCreatedAt())
                    .build();
            articleVersionRepository.save(v1);
            versions = List.of(v1);
        }

        return versions.stream()
                .map(this::mapToVersionResponse)
                .collect(Collectors.toList());
    }

    public ArticleVersionResponse getArticleVersion(Long articleId, Integer versionNumber, User currentUser) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found with id: " + articleId));
        projectService.getProjectIfAccessible(article.getProject().getId(), currentUser);

        ArticleVersion version = articleVersionRepository.findByArticleIdAndVersionNumber(articleId, versionNumber)
                .orElseThrow(() -> new RuntimeException("Version " + versionNumber + " not found for article " + articleId));

        return mapToVersionResponse(version);
    }

    @Transactional
    public ArticleResponse restoreArticleVersion(Long articleId, Integer versionNumber, User currentUser) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found with id: " + articleId));

        Project project = projectService.getProjectIfAccessible(article.getProject().getId(), currentUser);
        String role = projectService.getRoleForProject(project, currentUser);

        if ("VIEWER".equals(role)) {
            throw new RuntimeException("You do not have permission to restore versions in this project");
        }

        ArticleVersion targetVersion = articleVersionRepository.findByArticleIdAndVersionNumber(articleId, versionNumber)
                .orElseThrow(() -> new RuntimeException("Version " + versionNumber + " not found for article " + articleId));

        Optional<ArticleVersion> latestOpt = articleVersionRepository.findTopByArticleIdOrderByVersionNumberDesc(article.getId());
        int nextVersion = latestOpt.map(v -> v.getVersionNumber() + 1).orElse(1);

        article.setTitle(targetVersion.getTitle());
        article.setContent(targetVersion.getContent());
        Article restoredArticle = articleRepository.save(article);

        // Record the restoration event as a new version
        ArticleVersion restorationSnapshot = ArticleVersion.builder()
                .article(restoredArticle)
                .versionNumber(nextVersion)
                .title(targetVersion.getTitle())
                .content(targetVersion.getContent())
                .author(currentUser)
                .build();
        articleVersionRepository.save(restorationSnapshot);

        return mapToResponse(restoredArticle);
    }

    private ArticleResponse mapToResponse(Article article) {
        return ArticleResponse.builder()
                .id(article.getId())
                .title(article.getTitle())
                .content(article.getContent())
                .projectId(article.getProject().getId())
                .authorId(article.getAuthor().getId())
                .authorName(article.getAuthor().getName())
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .build();
    }

    private ArticleVersionResponse mapToVersionResponse(ArticleVersion version) {
        return ArticleVersionResponse.builder()
                .id(version.getId())
                .articleId(version.getArticle().getId())
                .versionNumber(version.getVersionNumber())
                .title(version.getTitle())
                .content(version.getContent())
                .authorId(version.getAuthor().getId())
                .authorName(version.getAuthor().getName())
                .createdAt(version.getCreatedAt())
                .build();
    }
}
