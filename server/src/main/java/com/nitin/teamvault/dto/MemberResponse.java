package com.nitin.teamvault.dto;

import com.nitin.teamvault.entity.ProjectRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MemberResponse {
    private Long id; // the member link id
    private Long userId;
    private String name;
    private String email;
    private ProjectRole role;
    private LocalDateTime joinedAt;
}
