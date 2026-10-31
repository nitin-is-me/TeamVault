package com.nitin.teamvault.repository;

import com.nitin.teamvault.entity.ArticleVersion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArticleVersionRepository extends JpaRepository<ArticleVersion, Long> {

    @EntityGraph(attributePaths = {"author"})
    List<ArticleVersion> findByArticleIdOrderByVersionNumberDesc(Long articleId);

    @EntityGraph(attributePaths = {"author"})
    Optional<ArticleVersion> findByArticleIdAndVersionNumber(Long articleId, Integer versionNumber);

    Optional<ArticleVersion> findTopByArticleIdOrderByVersionNumberDesc(Long articleId);

    void deleteByArticleId(Long articleId);
}
