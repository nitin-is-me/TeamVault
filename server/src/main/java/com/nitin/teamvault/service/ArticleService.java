package com.nitin.teamvault.service;

import com.nitin.teamvault.dto.ArticleRequest;
import com.nitin.teamvault.dto.ArticleResponse;
import com.nitin.teamvault.entity.Article;
import com.nitin.teamvault.entity.Project;
import com.nitin.teamvault.entity.User;
import com.nitin.teamvault.repository.ArticleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final ProjectService projectService;

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

    public ArticleResponse updateArticle(Long id, ArticleRequest request, User currentUser) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found with id: " + id));

        Project project = projectService.getProjectIfAccessible(article.getProject().getId(), currentUser); // verify access
        String role = projectService.getRoleForProject(project, currentUser);
        
        if ("VIEWER".equals(role)) {
            throw new RuntimeException("You do not have permission to edit articles in this project");
        }

        article.setTitle(request.getTitle());
        article.setContent(request.getContent());

        Article updatedArticle = articleRepository.save(article);
        return mapToResponse(updatedArticle);
    }

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
}
