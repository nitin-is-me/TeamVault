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
import com.nitin.teamvault.repository.ProjectMemberRepository;
import com.nitin.teamvault.repository.ProjectRepository;
import com.nitin.teamvault.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProjectService projectService;

    private User owner;
    private User otherUser;
    private Project project;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(1L).name("Owner").email("owner@example.com").build();
        otherUser = User.builder().id(2L).name("Other").email("other@example.com").build();
        project = Project.builder().id(10L).name("Project").createdBy(owner).build();
    }

    @Test
    void addMemberRejectsOwnerRole() {
        when(projectRepository.findByIdWithCreator(10L)).thenReturn(Optional.of(project));

        MemberRequest request = MemberRequest.builder()
                .email("other@example.com")
                .role(ProjectRole.OWNER)
                .build();

        assertThrows(BadRequestException.class, () -> projectService.addMember(10L, request, owner));
        verify(projectMemberRepository, never()).save(any());
    }

    @Test
    void addMemberRejectsDuplicateMembership() {
        when(projectRepository.findByIdWithCreator(10L)).thenReturn(Optional.of(project));
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherUser));
        when(projectMemberRepository.findByProjectIdAndUserId(10L, 2L))
                .thenReturn(Optional.of(ProjectMember.builder().project(project).user(otherUser).role(ProjectRole.VIEWER).build()));

        MemberRequest request = MemberRequest.builder()
                .email("  OTHER@example.com ")
                .role(ProjectRole.VIEWER)
                .build();

        assertThrows(ConflictException.class, () -> projectService.addMember(10L, request, owner));
        verify(projectMemberRepository, never()).save(any());
    }

    @Test
    void addMemberNormalizesEmailAndSaves() {
        when(projectRepository.findByIdWithCreator(10L)).thenReturn(Optional.of(project));
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherUser));
        when(projectMemberRepository.findByProjectIdAndUserId(10L, 2L)).thenReturn(Optional.empty());
        when(projectMemberRepository.save(any(ProjectMember.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MemberRequest request = MemberRequest.builder()
                .email("  OTHER@example.com ")
                .role(ProjectRole.EDITOR)
                .build();

        MemberResponse response = projectService.addMember(10L, request, owner);

        assertEquals(ProjectRole.EDITOR, response.getRole());
        assertEquals("other@example.com", response.getEmail());
    }

    @Test
    void nonOwnerCannotUpdateProject() {
        when(projectRepository.findByIdWithCreator(10L)).thenReturn(Optional.of(project));
        when(projectMemberRepository.findByProjectIdAndUserId(10L, 2L))
                .thenReturn(Optional.of(ProjectMember.builder().project(project).user(otherUser).role(ProjectRole.EDITOR).build()));

        ProjectRequest request = ProjectRequest.builder().name("New name").build();

        assertThrows(ForbiddenException.class, () -> projectService.updateProject(10L, request, otherUser));
    }

    @Test
    void nonOwnerCannotDeleteProject() {
        when(projectRepository.findByIdWithCreator(10L)).thenReturn(Optional.of(project));
        when(projectMemberRepository.findByProjectIdAndUserId(10L, 2L))
                .thenReturn(Optional.of(ProjectMember.builder().project(project).user(otherUser).role(ProjectRole.EDITOR).build()));

        assertThrows(ForbiddenException.class, () -> projectService.deleteProject(10L, otherUser));
    }

    @Test
    void ownerCannotBeRemoved() {
        when(projectRepository.findByIdWithCreator(10L)).thenReturn(Optional.of(project));

        assertThrows(BadRequestException.class, () -> projectService.removeMember(10L, 1L, owner));
    }

    @Test
    void getAllProjectsResolvesMembershipRole() {
        ProjectMember membership = ProjectMember.builder()
                .project(project)
                .user(otherUser)
                .role(ProjectRole.VIEWER)
                .build();

        when(projectMemberRepository.findByUserId(2L)).thenReturn(List.of(membership));
        when(projectRepository.findAllAccessibleProjects(otherUser)).thenReturn(List.of(project));

        List<ProjectResponse> projects = projectService.getAllProjects(otherUser);

        assertEquals(1, projects.size());
        assertEquals("VIEWER", projects.get(0).getCurrentUserRole());
    }

    @Test
    void getMembersIncludesOwnerFirst() {
        ProjectMember membership = ProjectMember.builder()
                .id(5L)
                .project(project)
                .user(otherUser)
                .role(ProjectRole.EDITOR)
                .build();

        when(projectRepository.findByIdWithCreator(10L)).thenReturn(Optional.of(project));
        when(projectMemberRepository.findByProjectId(10L)).thenReturn(List.of(membership));

        List<MemberResponse> members = projectService.getMembers(10L, owner);

        assertEquals(2, members.size());
        assertEquals(ProjectRole.OWNER, members.get(0).getRole());
        assertEquals(ProjectRole.EDITOR, members.get(1).getRole());
    }
}
