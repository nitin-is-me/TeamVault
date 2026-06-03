# Role-Based Access Control (RBAC) Explained

This document explains why TeamVault uses RBAC and how it is implemented to protect projects and articles from unauthorized modifications.

---

## 1. Authentication vs Authorization (Again)

If you read `JWT_EXPLAINED.md`, you know that:
- **Authentication** is answering: *"Who are you?"* (The JWT handles this).
- **Authorization** is answering: *"Are you allowed to do this?"* (RBAC handles this).

Just because a user is authenticated (logged in) does not mean they have the right to edit *your* project. We need a system to control access on a granular level.

---

## 2. Why RBAC?

Without RBAC, the system is binary:
1. You are logged out (can't see anything).
2. You are logged in (can see and edit EVERYTHING).

In a collaborative tool like TeamVault, this is disastrous. We need to define "Roles" for users on a per-project basis. 

---

## 3. TeamVault's Authorization Model

TeamVault defines three specific roles inside the `ProjectRole` enum. These roles are scoped to a specific project. A user can be the `OWNER` of Project A, but only a `VIEWER` on Project B.

### The Roles
1. **`OWNER`**: The creator of the project. Has absolute control. Can create/edit/delete articles, and crucially, is the *only* person who can invite new members or manage the team.
2. **`EDITOR`**: An invited collaborator. Can read, create, edit, and delete articles within the project. Cannot invite other users.
3. **`VIEWER`**: A read-only guest. Can read articles, but cannot create, edit, or delete them. Cannot see the team management UI.

---

## 4. The `ProjectMember` Entity

How do we actually store these roles? We use a mapping table (or "Join Entity") called `ProjectMember`.

```java
public class ProjectMember {
    @ManyToOne
    private Project project;

    @ManyToOne
    private User user;

    @Enumerated(EnumType.STRING)
    private ProjectRole role;
}
```

This acts as the source of truth for authorization. Whenever a user tries to do something in a project, we look at the `ProjectMember` table to find the intersection of the `User` and the `Project`, and check the `role` column.

---

## 5. Permission Checks in Action

Let's look at a real-world example from the `ArticleService`.

When a user tries to delete an article, the system does exactly two things:
1. **Authentication:** The `JwtAuthenticationFilter` ensures the request is coming from a logged-in user.
2. **Authorization (RBAC):** The `ArticleService` checks the user's role in that specific project.

```java
// 1. Fetch the user's role for this specific project
ProjectRole role = projectService.getRoleForProject(projectId, currentUser);

// 2. Enforce RBAC rules
if (role == ProjectRole.VIEWER) {
    throw new AccessDeniedException("Viewers cannot delete articles.");
}

// 3. Proceed with deletion
articleRepository.delete(article);
```

### Frontend RBAC Enforcement
The backend is the ultimate source of security. However, for a good user experience, the frontend also uses RBAC. 

When you load a project, the backend includes your `currentUserRole` in the `ProjectResponse` DTO. 
The React frontend reads this role and conditionally hides UI elements:
- If `role === 'VIEWER'`, the "Edit Article" and "+ New Article" buttons are completely hidden.
- If `role !== 'OWNER'`, the "Team" management button is hidden.

This ensures users aren't confused by buttons that would just throw a server error anyway!
