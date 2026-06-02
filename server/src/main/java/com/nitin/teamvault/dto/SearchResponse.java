package com.nitin.teamvault.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SearchResponse {
    private List<ProjectResponse> projects;
    private List<ArticleResponse> articles;
}
