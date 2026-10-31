package com.nitin.teamvault.service;

import com.nitin.teamvault.dto.ArticleResponse;
import com.nitin.teamvault.dto.ProjectResponse;
import com.nitin.teamvault.dto.SearchResponse;
import com.nitin.teamvault.entity.Article;
import com.nitin.teamvault.entity.Project;
import com.nitin.teamvault.entity.User;
import com.nitin.teamvault.repository.ArticleRepository;
import com.nitin.teamvault.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private static final int MAX_RESULTS_PER_TYPE = 50;

    private final ProjectRepository projectRepository;
    private final ArticleRepository articleRepository;

    public SearchResponse searchGlobally(String query, User currentUser) {
        if (query == null || query.trim().isEmpty()) {
            return SearchResponse.builder()
                    .projects(List.of())
                    .articles(List.of())
                    .build();
        }

        // Cap result size so a broad query cannot dump every document into one response.
        PageRequest limit = PageRequest.of(0, MAX_RESULTS_PER_TYPE);
        List<Project> projects = projectRepository.searchAccessibleProjects(currentUser, query.trim(), limit);
        List<Article> articles = articleRepository.searchAccessibleArticles(currentUser, query.trim(), limit);

        List<ProjectResponse> projectResponses = projects.stream().map(this::mapProject).collect(Collectors.toList());
        List<ArticleResponse> articleResponses = articles.stream().map(this::mapArticle).collect(Collectors.toList());

        return SearchResponse.builder()
                .projects(projectResponses)
                .articles(articleResponses)
                .build();
    }

    private ProjectResponse mapProject(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .createdById(project.getCreatedBy().getId())
                .createdByName(project.getCreatedBy().getName())
                .createdAt(project.getCreatedAt())
                .build();
    }

    private ArticleResponse mapArticle(Article article) {
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
