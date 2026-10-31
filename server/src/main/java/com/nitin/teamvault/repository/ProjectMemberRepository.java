package com.nitin.teamvault.repository;

import com.nitin.teamvault.entity.ProjectMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    @EntityGraph(attributePaths = {"user"})
    List<ProjectMember> findByProjectId(Long projectId);

    @EntityGraph(attributePaths = {"project"})
    List<ProjectMember> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"user"})
    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);

    void deleteByProjectId(Long projectId);
}
