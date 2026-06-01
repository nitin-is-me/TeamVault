package com.nitin.teamvault.dto;

import jakarta.validation.constraints.NotBlank;
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
    private String title;
    
    @NotBlank(message = "Article content cannot be empty")
    private String content;
}
