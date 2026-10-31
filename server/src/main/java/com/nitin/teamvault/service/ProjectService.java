package com.nitin.teamvault.service;

import com.nitin.teamvault.dto.MemberRequest;
import com.nitin.teamvault.dto.MemberResponse;
import com.nitin.teamvault.dto.ProjectRequest;
import com.nitin.teamvault.dto.ProjectResponse;
import com.nitin.teamvault.entity.Project;
import com.nitin.teamvault.entity.ProjectMember;
import com.nitin.teamvault.entity.ProjectRole;
import com.nitin.teamvault.entity.User;
import com.nitin.teamvault.exception.BadRequestException;
import com.nitin.teamvault.exception.ConflictException;
import com.nitin.teamvault.exception.ForbiddenException;
import com.nitin.teamvault.exception.ResourceNotFoundException;
import com.nitin.teamvault.repository.ProjectMemberRepository;
import com.nitin.teamvault.repository.ProjectRepository;
import com.nitin.teamvault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    public ProjectResponse createProject(ProjectRequest request, User currentUser) {
        Project project = Project.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .createdBy(currentUser)
                .build();

        Project savedProject = projectRepository.save(project);
        return mapToResponse(savedProject, "OWNER");
    }

    public List<ProjectResponse> getAllProjects(User currentUser) {
        // Load every membership for this user once instead of issuing one query per project.
        Map<Long, ProjectRole> rolesByProject = new HashMap<>();
        for (ProjectMember membership : projectMemberRepository.findByUserId(currentUser.getId())) {
            rolesByProject.put(membership.getProject().getId(), membership.getRole());
        }

        return projectRepository.findAllAccessibleProjects(currentUser).stream()
                .map(project -> mapToResponse(project, resolveRole(project, currentUser, rolesByProject)))
                .collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(Long id, User currentUser) {
        Project project = getProjectIfAccessible(id, currentUser);
        return mapToResponse(project, getRoleForProject(project, currentUser));
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectRequest request, User currentUser) {
        Project project = getProjectIfAccessible(id, currentUser);

        if (!isOwner(project, currentUser)) {
            throw new ForbiddenException("Only the project owner can edit this project");
        }

        project.setName(request.getName().trim());
        project.setDescription(request.getDescription());

        Project savedProject = projectRepository.save(project);
        return mapToResponse(savedProject, "OWNER");
    }

    @Transactional
    public void deleteProject(Long id, User currentUser) {
        Project project = getProjectIfAccessible(id, currentUser);

        if (!isOwner(project, currentUser)) {
            throw new ForbiddenException("Only the project owner can delete this project");
        }

        // Delete all members mapping first to avoid foreign key constraints
        projectMemberRepository.deleteByProjectId(id);

        // Delete project (cascade will handle articles)
        projectRepository.delete(project);
    }

    // --- Membership Management ---

    public MemberResponse addMember(Long projectId, MemberRequest request, User currentUser) {
        Project project = getProjectIfAccessible(projectId, currentUser);

        if (!isOwner(project, currentUser)) {
            throw new ForbiddenException("Only the project creator can add members");
        }

        ProjectRole role = request.getRole() == null ? ProjectRole.VIEWER : request.getRole();
        // The creator is the only OWNER. Never allow OWNER to be assigned through an invite.
        if (role == ProjectRole.OWNER) {
            throw new BadRequestException("The OWNER role cannot be assigned to invited members");
        }

        String email = normalizeEmail(request.getEmail());
        User userToAdd = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No user found with email: " + email));

        if (isOwner(project, userToAdd)) {
            throw new ConflictException("The creator is already a member of this project");
        }

        if (projectMemberRepository.findByProjectIdAndUserId(projectId, userToAdd.getId()).isPresent()) {
            throw new ConflictException("User is already a member of this project");
        }

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(userToAdd)
                .role(role)
                .build();

        ProjectMember savedMember = projectMemberRepository.save(member);
        return mapToMemberResponse(savedMember);
    }

    public List<MemberResponse> getMembers(Long projectId, User currentUser) {
        Project project = getProjectIfAccessible(projectId, currentUser); // verify access

        List<MemberResponse> members = new ArrayList<>();
        // The creator is not stored in project_members, so expose them first explicitly.
        members.add(MemberResponse.builder()
                .userId(project.getCreatedBy().getId())
                .name(project.getCreatedBy().getName())
                .email(project.getCreatedBy().getEmail())
                .role(ProjectRole.OWNER)
                .joinedAt(project.getCreatedAt())
                .build());

        projectMemberRepository.findByProjectId(projectId).stream()
                .filter(member -> !member.getUser().getId().equals(project.getCreatedBy().getId()))
                .map(this::mapToMemberResponse)
                .forEach(members::add);

        return members;
    }

    @Transactional
    public void removeMember(Long projectId, Long userId, User currentUser) {
        Project project = getProjectIfAccessible(projectId, currentUser);

        if (!isOwner(project, currentUser)) {
            throw new ForbiddenException("Only the project creator can remove members");
        }

        if (project.getCreatedBy().getId().equals(userId)) {
            throw new BadRequestException("The project owner cannot be removed from the project");
        }

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in project"));

        projectMemberRepository.delete(member);
    }

    // --- Helpers ---

    public Project getProjectIfAccessible(Long projectId, User user) {
        Project project = projectRepository.findByIdWithCreator(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (isOwner(project, user)) {
            return project;
        }

        projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ForbiddenException("Access denied: You are not a member of this project"));

        return project;
    }

    public String getRoleForProject(Project project, User currentUser) {
        if (currentUser == null) {
            return "VIEWER";
        }
        if (isOwner(project, currentUser)) {
            return "OWNER";
        }

        return projectMemberRepository.findByProjectIdAndUserId(project.getId(), currentUser.getId())
                .map(member -> normalizeMemberRole(member.getRole()))
                .orElse("VIEWER");
    }

    private String resolveRole(Project project, User currentUser, Map<Long, ProjectRole> rolesByProject) {
        if (isOwner(project, currentUser)) {
            return "OWNER";
        }
        ProjectRole role = rolesByProject.get(project.getId());
        return role == null ? "VIEWER" : normalizeMemberRole(role);
    }

    /**
     * Defensive guard for legacy rows that may contain OWNER in project_members.
     * Only the project creator can ever act as OWNER.
     */
    private String normalizeMemberRole(ProjectRole role) {
        return role == ProjectRole.OWNER ? "EDITOR" : role.name();
    }

    private boolean isOwner(Project project, User user) {
        return project.getCreatedBy().getId().equals(user.getId());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private ProjectResponse mapToResponse(Project project, String role) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .createdById(project.getCreatedBy().getId())
                .createdByName(project.getCreatedBy().getName())
                .createdAt(project.getCreatedAt())
                .currentUserRole(role)
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
