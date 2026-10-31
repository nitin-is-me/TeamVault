package com.nitin.teamvault.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ArticleRequest {

    @NotBlank(message = "Article title is required")
    @Size(max = 200, message = "Article title must be 200 characters or fewer")
    private String title;

    @NotBlank(message = "Article content cannot be empty")
    @Size(max = 200000, message = "Article content is too large")
    private String content;
}
