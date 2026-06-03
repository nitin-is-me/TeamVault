# TeamVault Internal Documentation

Welcome to the TeamVault documentation directory! This folder contains everything you need to understand the architecture, database modeling, and deployment strategies used in this project. 

These documents are designed as beginner-friendly refreshers for your future self (or for onboarding new team members).

---

## 📚 Suggested Reading Order

If you are trying to understand the system from top to bottom, read the documents in this order:

1. **[PROJECT_ARCHITECTURE.md](https://github.com/nitin-is-me/TeamVault/tree/master/docs/PROJECT_ARCHITECTURE.md)**
   Start here. A high-level overview of why the project exists, the core features, the technology stack, and the overall system design.

2. **[DTOS_AND_LAYERS.md](https://github.com/nitin-is-me/TeamVault/tree/master/docs/DTOS_AND_LAYERS.md)**
   Explains the Controller-Service-Repository pattern. Why does Spring Boot have so many layers compared to Express.js, and what exactly is a DTO?

3. **[JPA_RELATIONSHIPS.md](https://github.com/nitin-is-me/TeamVault/tree/master/docs/JPA_RELATIONSHIPS.md)**
   Deep dive into database modeling using Hibernate. Explains `@OneToMany`, `@ManyToOne`, join columns, and how Java objects map to SQL tables.

4. **[SPRING_DATA_JPA.md](https://github.com/nitin-is-me/TeamVault/tree/master/docs/SPRING_DATA_JPA.md)**
   Explains how to query the database using `JpaRepository`, JPQL, derived query methods, and lazy vs eager loading.

5. **[JWT_EXPLAINED.md](https://github.com/nitin-is-me/TeamVault/tree/master/docs/JWT_EXPLAINED.md)**
   The conceptual foundation of stateless authentication. What is a JWT, why do we use it instead of cookies, and how does the login flow work conceptually?

6. **[SPRING_SECURITY.md](https://github.com/nitin-is-me/TeamVault/tree/master/docs/SPRING_SECURITY.md)**
   The technical implementation of security. How Spring Security uses `SecurityFilterChain`, `AuthenticationManager`, and custom filters to intercept requests and validate JWTs.

7. **[RBAC_EXPLAINED.md](https://github.com/nitin-is-me/TeamVault/tree/master/docs/RBAC_EXPLAINED.md)**
   Explains Authorization. How TeamVault implements Role-Based Access Control (`OWNER`, `EDITOR`, `VIEWER`) using the `ProjectMember` join table to protect resources.

8. **[DEPLOYMENT.md](https://github.com/nitin-is-me/TeamVault/tree/master/docs/DEPLOYMENT.md)**
   The DevOps crash course. Explains environment variables, Spring profiles, Docker, Docker Hub, Render hosting, and GitHub Actions CI/CD pipelines.

9. **[DOCKERFILE.md](https://github.com/nitin-is-me/TeamVault/tree/master/docs/DOCKERFILE.md)**
   A granular, line-by-line syntax breakdown of the TeamVault `Dockerfile` and the `.github/workflows/docker.yml` GitHub Actions workflow.

---

> [!TIP]
> If you find yourself confused by a specific concept while coding, look for the corresponding file in this index. Each file is designed to have a **Single Responsibility**, meaning there is minimal overlap.
