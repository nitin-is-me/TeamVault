package com.nitin.teamvault.service;

import com.nitin.teamvault.dto.ArticleRequest;
import com.nitin.teamvault.dto.ArticleResponse;
import com.nitin.teamvault.entity.Article;
import com.nitin.teamvault.entity.ArticleVersion;
import com.nitin.teamvault.entity.Project;
import com.nitin.teamvault.entity.User;
import com.nitin.teamvault.exception.ForbiddenException;
import com.nitin.teamvault.exception.ResourceNotFoundException;
import com.nitin.teamvault.repository.ArticleRepository;
import com.nitin.teamvault.repository.ArticleVersionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ArticleServiceTest {

    @Mock
    private ArticleRepository articleRepository;

    @Mock
    private ArticleVersionRepository articleVersionRepository;

    @Mock
    private ProjectService projectService;

    @InjectMocks
    private ArticleService articleService;

    private User author;
    private Project project;
    private Article article;

    @BeforeEach
    void setUp() {
        author = User.builder().id(1L).name("Author").email("author@example.com").build();
        project = Project.builder().id(10L).name("Project").createdBy(author).build();
        article = Article.builder()
                .id(5L)
                .title("Old title")
                .content("Old content")
                .project(project)
                .author(author)
                .build();
    }

    @Test
    void viewerCannotCreateArticle() {
        when(projectService.getProjectIfAccessible(10L, author)).thenReturn(project);
        when(projectService.getRoleForProject(project, author)).thenReturn("VIEWER");

        ArticleRequest request = ArticleRequest.builder().title("New").content("Body").build();

        assertThrows(ForbiddenException.class, () -> articleService.createArticle(10L, request, author));
        verify(articleRepository, never()).save(any());
    }

    @Test
    void updateCreatesNextVersionSnapshot() {
        when(articleRepository.findDetailedById(5L)).thenReturn(Optional.of(article));
        when(projectService.getProjectIfAccessible(10L, author)).thenReturn(project);
        when(projectService.getRoleForProject(project, author)).thenReturn("EDITOR");
        when(articleVersionRepository.findTopByArticleIdOrderByVersionNumberDesc(5L))
                .thenReturn(Optional.of(ArticleVersion.builder().versionNumber(3).build()));
        when(articleRepository.save(any(Article.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(articleVersionRepository.save(any(ArticleVersion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ArticleRequest request = ArticleRequest.builder().title("  New title  ").content("New content").build();
        ArticleResponse response = articleService.updateArticle(5L, request, author);

        assertEquals("New title", response.getTitle());
        assertEquals("New content", response.getContent());

        ArgumentCaptor<ArticleVersion> versionCaptor = ArgumentCaptor.forClass(ArticleVersion.class);
        verify(articleVersionRepository).save(versionCaptor.capture());
        assertEquals(4, versionCaptor.getValue().getVersionNumber());
        assertEquals("New title", versionCaptor.getValue().getTitle());
    }

    @Test
    void updateLegacyArticleCreatesV1AndV2() {
        when(articleRepository.findDetailedById(5L)).thenReturn(Optional.of(article));
        when(projectService.getProjectIfAccessible(10L, author)).thenReturn(project);
        when(projectService.getRoleForProject(project, author)).thenReturn("EDITOR");
        when(articleVersionRepository.findTopByArticleIdOrderByVersionNumberDesc(5L)).thenReturn(Optional.empty());
        when(articleRepository.save(any(Article.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(articleVersionRepository.save(any(ArticleVersion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ArticleRequest request = ArticleRequest.builder().title("New title").content("New content").build();
        articleService.updateArticle(5L, request, author);

        ArgumentCaptor<ArticleVersion> versionCaptor = ArgumentCaptor.forClass(ArticleVersion.class);
        verify(articleVersionRepository, times(2)).save(versionCaptor.capture());
        assertEquals(1, versionCaptor.getAllValues().get(0).getVersionNumber());
        assertEquals(2, versionCaptor.getAllValues().get(1).getVersionNumber());
    }

    @Test
    void restoreCreatesNewSnapshotWithTargetContent() {
        ArticleVersion target = ArticleVersion.builder()
                .versionNumber(1)
                .title("Original title")
                .content("Original content")
                .build();

        when(articleRepository.findDetailedById(5L)).thenReturn(Optional.of(article));
        when(projectService.getProjectIfAccessible(10L, author)).thenReturn(project);
        when(projectService.getRoleForProject(project, author)).thenReturn("OWNER");
        when(articleVersionRepository.findByArticleIdAndVersionNumber(5L, 1)).thenReturn(Optional.of(target));
        when(articleVersionRepository.findTopByArticleIdOrderByVersionNumberDesc(5L))
                .thenReturn(Optional.of(ArticleVersion.builder().versionNumber(3).build()));
        when(articleRepository.save(any(Article.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(articleVersionRepository.save(any(ArticleVersion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ArticleResponse response = articleService.restoreArticleVersion(5L, 1, author);

        assertEquals("Original title", response.getTitle());
        assertEquals("Original content", response.getContent());

        ArgumentCaptor<ArticleVersion> versionCaptor = ArgumentCaptor.forClass(ArticleVersion.class);
        verify(articleVersionRepository).save(versionCaptor.capture());
        assertEquals(4, versionCaptor.getValue().getVersionNumber());
        assertEquals("Original content", versionCaptor.getValue().getContent());
    }

    @Test
    void missingArticleReturnsNotFound() {
        when(articleRepository.findDetailedById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> articleService.getArticleById(99L, author));
    }
}
