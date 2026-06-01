package com.nitin.teamvault.repository;

import com.nitin.teamvault.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    // Spring Data JPA magically implements this query for us!
    List<Article> findByProjectId(Long projectId);
}
