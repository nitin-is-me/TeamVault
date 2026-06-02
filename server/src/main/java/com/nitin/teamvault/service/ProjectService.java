package com.nitin.teamvault.service;

import com.nitin.teamvault.dto.MemberRequest;
import com.nitin.teamvault.dto.MemberResponse;
import com.nitin.teamvault.dto.ProjectRequest;
import com.nitin.teamvault.dto.ProjectResponse;
import com.nitin.teamvault.entity.Project;
import com.nitin.teamvault.entity.ProjectMember;
import com.nitin.teamvault.entity.User;
import com.nitin.teamvault.repository.ProjectMemberRepository;
import com.nitin.teamvault.repository.ProjectRepository;
import com.nitin.teamvault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    public ProjectResponse createProject(ProjectRequest request, User currentUser) {
        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .createdBy(currentUser)
                .build();

        Project savedProject = projectRepository.save(project);
        return mapToResponse(savedProject);
    }

    public List<ProjectResponse> getAllProjects(User currentUser) {
        return projectRepository.findAllAccessibleProjects(currentUser).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(Long id, User currentUser) {
        Project project = getProjectIfAccessible(id, currentUser);
        return mapToResponse(project);
    }

    // --- Membership Management ---

    public MemberResponse addMember(Long projectId, MemberRequest request, User currentUser) {
        Project project = getProjectIfAccessible(projectId, currentUser);
        
        // For MVP: Only creator can add members
        if (!project.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only the project creator can add members");
        }

        User userToAdd = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));

        if (project.getCreatedBy().getId().equals(userToAdd.getId())) {
            throw new RuntimeException("Creator is already a member");
        }

        if (projectMemberRepository.findByProjectIdAndUserId(projectId, userToAdd.getId()).isPresent()) {
            throw new RuntimeException("User is already a member of this project");
        }

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(userToAdd)
                .role(request.getRole())
                .build();

        ProjectMember savedMember = projectMemberRepository.save(member);
        return mapToMemberResponse(savedMember);
    }

    public List<MemberResponse> getMembers(Long projectId, User currentUser) {
        getProjectIfAccessible(projectId, currentUser); // verify access
        return projectMemberRepository.findByProjectId(projectId).stream()
                .map(this::mapToMemberResponse)
                .collect(Collectors.toList());
    }

    public void removeMember(Long projectId, Long userId, User currentUser) {
        Project project = getProjectIfAccessible(projectId, currentUser);
        
        if (!project.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only the project creator can remove members");
        }

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new RuntimeException("Member not found in project"));

        projectMemberRepository.delete(member);
    }

    // --- Helpers ---

    public Project getProjectIfAccessible(Long projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (project.getCreatedBy().getId().equals(user.getId())) {
            return project;
        }

        projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new RuntimeException("Access denied: You are not a member of this project"));

        return project;
    }

    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .createdById(project.getCreatedBy().getId())
                .createdByName(project.getCreatedBy().getName())
                .createdAt(project.getCreatedAt())
                .build();
    }

    private MemberResponse mapToMemberResponse(ProjectMember member) {
        return MemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser().getId())
                .name(member.getUser().getName())
                .email(member.getUser().getEmail())
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }
}
