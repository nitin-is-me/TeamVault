package com.nitin.teamvault.controller;

import com.nitin.teamvault.dto.SearchResponse;
import com.nitin.teamvault.entity.User;
import com.nitin.teamvault.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<SearchResponse> search(
            @RequestParam String q,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(searchService.searchGlobally(q, currentUser));
    }
}
