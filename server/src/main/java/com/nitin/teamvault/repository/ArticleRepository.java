package com.nitin.teamvault.repository;

import com.nitin.teamvault.entity.Article;
import com.nitin.teamvault.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {

    @EntityGraph(attributePaths = {"project", "author"})
    @Query("SELECT a FROM Article a WHERE a.id = :id")
    Optional<Article> findDetailedById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"project", "author"})
    List<Article> findByProjectIdOrderByUpdatedAtDesc(Long projectId);

    @EntityGraph(attributePaths = {"project", "author"})
    @Query("SELECT a FROM Article a WHERE (a.project.createdBy = :user OR a.project IN (SELECT pm.project FROM ProjectMember pm WHERE pm.user = :user)) AND (LOWER(a.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(a.content) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Article> searchAccessibleArticles(@Param("user") User user, @Param("query") String query, Pageable pageable);
}
