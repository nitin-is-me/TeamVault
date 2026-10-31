package com.nitin.teamvault.repository;

import com.nitin.teamvault.entity.Project;
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
public interface ProjectRepository extends JpaRepository<Project, Long> {

    @EntityGraph(attributePaths = {"createdBy"})
    @Query("SELECT p FROM Project p WHERE p.id = :id")
    Optional<Project> findByIdWithCreator(@Param("id") Long id);

    @EntityGraph(attributePaths = {"createdBy"})
    @Query("SELECT p FROM Project p WHERE p.createdBy = :user OR p IN (SELECT pm.project FROM ProjectMember pm WHERE pm.user = :user)")
    List<Project> findAllAccessibleProjects(@Param("user") User user);

    @EntityGraph(attributePaths = {"createdBy"})
    @Query("SELECT p FROM Project p WHERE (p.createdBy = :user OR p IN (SELECT pm.project FROM ProjectMember pm WHERE pm.user = :user)) AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Project> searchAccessibleProjects(@Param("user") User user, @Param("query") String query, Pageable pageable);
}
