package com.nitin.teamvault.repository;

import com.nitin.teamvault.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.nitin.teamvault.entity.User;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    
    @Query("SELECT p FROM Project p WHERE p.createdBy = :user OR p IN (SELECT pm.project FROM ProjectMember pm WHERE pm.user = :user)")
    List<Project> findAllAccessibleProjects(@Param("user") User user);

    @Query("SELECT p FROM Project p WHERE (p.createdBy = :user OR p IN (SELECT pm.project FROM ProjectMember pm WHERE pm.user = :user)) AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Project> searchAccessibleProjects(@Param("user") User user, @Param("query") String query);
}
