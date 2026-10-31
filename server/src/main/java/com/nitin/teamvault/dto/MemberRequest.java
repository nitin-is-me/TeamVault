package com.nitin.teamvault.dto;

import com.nitin.teamvault.entity.ProjectRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
    @Size(max = 255, message = "Email must be 255 characters or fewer")
    private String email;

    @NotNull(message = "Role is required")
    @Builder.Default
    private ProjectRole role = ProjectRole.VIEWER;
}
