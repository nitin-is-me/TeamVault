package com.nitin.teamvault.dto;

import com.nitin.teamvault.entity.ProjectRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MemberRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email")
    private String email;
    
    @Builder.Default
    private ProjectRole role = ProjectRole.VIEWER;
}
