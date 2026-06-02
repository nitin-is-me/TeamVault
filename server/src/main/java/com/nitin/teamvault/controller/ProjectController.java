package com.nitin.teamvault.controller;

import com.nitin.teamvault.dto.MemberRequest;
import com.nitin.teamvault.dto.MemberResponse;
import com.nitin.teamvault.dto.ProjectRequest;
import com.nitin.teamvault.dto.ProjectResponse;
import com.nitin.teamvault.entity.User;
import com.nitin.teamvault.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody ProjectRequest request,
            // Spring Security magically injects the currently logged-in user here!
            @AuthenticationPrincipal User currentUser
    ) {
        return new ResponseEntity<>(projectService.createProject(request, currentUser), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getAllProjects(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(projectService.getAllProjects(currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(projectService.getProjectById(id, currentUser));
    }

    @PostMapping("/{projectId}/members")
    public ResponseEntity<MemberResponse> addMember(
            @PathVariable Long projectId,
            @Valid @RequestBody MemberRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return new ResponseEntity<>(projectService.addMember(projectId, request, currentUser), HttpStatus.CREATED);
    }

    @GetMapping("/{projectId}/members")
    public ResponseEntity<List<MemberResponse>> getMembers(
            @PathVariable Long projectId,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(projectService.getMembers(projectId, currentUser));
    }

    @DeleteMapping("/{projectId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long projectId,
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser
    ) {
        projectService.removeMember(projectId, userId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
