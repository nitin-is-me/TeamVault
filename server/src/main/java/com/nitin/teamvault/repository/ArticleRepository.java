package com.nitin.teamvault.repository;

import com.nitin.teamvault.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    // Spring Data JPA magically implements this query for us!
    List<Article> findByProjectId(Long projectId);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Article a WHERE (a.project.createdBy = :user OR a.project IN (SELECT pm.project FROM ProjectMember pm WHERE pm.user = :user)) AND (LOWER(a.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(a.content) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Article> searchAccessibleArticles(@org.springframework.data.repository.query.Param("user") com.nitin.teamvault.entity.User user, @org.springframework.data.repository.query.Param("query") String query);
}
