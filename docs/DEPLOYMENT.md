# Spring Boot Deployment Explained (Docker, Render, Environment Variables, Profiles and CI/CD)

## Why I Am Writing This

When preparing TeamVault for deployment, I got confused by:

* Environment Variables
* application.properties
* application-dev.properties
* Spring Profiles
* Docker
* Docker Images
* Docker Hub
* GitHub Actions
* CI/CD
* Render Deployment

Everything seemed connected but I couldn't understand who was responsible for what.

This document explains the entire deployment flow from my laptop to a live server.

---

# The Big Picture

My application has:

```text
Frontend
    ↓
Spring Boot Backend
    ↓
PostgreSQL Database
```

When running locally:

```text
My Laptop
 ├── Frontend
 ├── Spring Boot
 └── PostgreSQL
```

When deployed:

```text
Vercel
 └── Frontend

Render
 └── Spring Boot

Supabase / Render PostgreSQL
 └── Database
```

---

# Problem #1: Secrets

Initially I had:

```properties
spring.datasource.url=actual_database_url
spring.datasource.username=postgres
spring.datasource.password=password123
jwt.secret=mysecretjwtkey
```

This works.

But it is dangerous.

If I push this to GitHub:

```text
Everyone can see my credentials.
```

---

# Environment Variables

Instead of:

```properties
spring.datasource.password=password123
```

we write:

```properties
spring.datasource.password=${DB_PASSWORD}
```

Now Spring says:

```text
I don't know the password.

Ask the operating system for DB_PASSWORD.
```

The actual password is stored outside the code.

---

# Example

application.properties

```properties
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
jwt.secret=${JWT_SECRET}
```

---

Render Environment Variables

```text
DB_URL=postgres://...
DB_USERNAME=postgres
DB_PASSWORD=super-secret-password
JWT_SECRET=my-production-secret
```

When Spring starts:

```text
${DB_URL}
```

becomes:

```text
postgres://...
```

automatically.

---

# Spring Profiles

Profiles are configuration groups.

Think:

```text
Development Config
Production Config
Testing Config
```

Each environment may need different settings.

---

# Example

application.properties

```properties
spring.datasource.url=${DB_URL}
```

---

application-dev.properties

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/teamvault
```

---

If profile is:

```properties
spring.profiles.active=dev
```

Spring loads:

```text
application.properties
+
application-dev.properties
```

---

# Important Rule

If the same property appears twice:

```text
The later profile overrides the earlier value.
```

Example:

application.properties

```properties
app.name=TeamVault
```

application-dev.properties

```properties
app.name=TeamVault DEV
```

Result:

```text
TeamVault DEV
```

---

# Why Use Profiles?

Development:

```text
Local PostgreSQL
Debug Logging
Local JWT Secret
```

Production:

```text
Cloud Database
Production JWT Secret
Less Logging
```

One codebase.

Different environments.

---

# What Is Docker?

Docker solves:

```text
"It works on my machine."
```

problem.

Without Docker:

```text
Java Version
OS
Dependencies
Configuration
```

might differ between computers.

---

Docker creates a package containing:

```text
Application
Java Runtime
Dependencies
Configuration
```

Everything needed to run.

---

# Dockerfile

Dockerfile is NOT the application.

Dockerfile is the RECIPE.

> [!NOTE]
> For a line-by-line breakdown of exactly what the TeamVault `Dockerfile` does, read [DOCKERFILE.md](https://github.com/nitin-is-me/TeamVault/tree/master/docs/DOCKERFILE.md).

Think:

```text
Recipe
↓
Cake
```

Dockerfile:

```text
Recipe
```

Docker Image:

```text
Cake
```

---

Example Flow

```text
Dockerfile
    ↓
docker build
    ↓
Docker Image
```

---

# What Is A Docker Image?

A Docker Image is:

```text
A packaged version of my application.
```

Example:

```text
TeamVault Image
```

contains:

```text
Spring Boot JAR
Java Runtime
Dependencies
```

---

Render can run Docker Images directly.

---

# What Happens During docker build?

Docker reads:

```text
Dockerfile
```

and executes instructions.

Example:

```dockerfile
COPY target/teamvault.jar app.jar
```

```dockerfile
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Result:

```text
Runnable Docker Image
```

---

# Docker Hub

Docker Hub is basically:

```text
GitHub
for Docker Images
```

GitHub stores:

```text
Source Code
```

Docker Hub stores:

```text
Built Images
```

---

# Why Use Docker Hub?

Without Docker Hub:

```text
Render
↓
Pull Source Code
↓
Build Image
↓
Run Application
```

With Docker Hub:

```text
Render
↓
Pull Ready Image
↓
Run Application
```

Build already happened elsewhere.

---

# What Is CI/CD?

CI/CD means:

```text
Continuous Integration
Continuous Deployment
```

Don't focus on the fancy words.

Think:

```text
Automate repetitive deployment tasks.
```

---

Without CI/CD

```text
Push Code
↓
Login Server
↓
Build Application
↓
Deploy Application
```

Manually.

Every time.

---

With CI/CD

```text
Push Code
↓
Automation Runs
↓
Build
↓
Deploy
```

Automatically.

---

# What Is GitHub Actions?

GitHub Actions is GitHub's automation system.

> [!NOTE]
> For a line-by-line breakdown of exactly what the TeamVault `docker.yml` workflow does, read [DOCKERFILE.md](https://github.com/nitin-is-me/TeamVault/tree/master/docs/DOCKERFILE.md).

Example:

Whenever I push:

```text
main branch
```

GitHub automatically:

```text
Run Tests
Build Docker Image
Push Docker Image
```

without me doing anything.

---

# Why Antigravity Created GitHub Actions

Antigravity likely created:

```text
.github/workflows/build.yml
```

which does:

```text
Push Code
↓
GitHub Builds Docker Image
↓
GitHub Pushes Image To Docker Hub
```

---

# Why Is This Useful?

Render free tier has limited resources.

Building Docker Images consumes:

```text
CPU
Memory
Time
```

If GitHub builds image first:

```text
Render only downloads image.
```

Render does less work.

---

# Render Build Strategy

Option A

Render builds image.

```text
GitHub
↓
Render
↓
Build
↓
Deploy
```

Simple.

Perfect for personal projects.

---

Option B

GitHub builds image.

```text
GitHub
↓
Docker Hub
↓
Render
↓
Deploy
```

More professional.

More scalable.

More moving parts.

---

# Which Should I Use For TeamVault?

For V1:

```text
GitHub
↓
Render
↓
Dockerfile
↓
Deploy
```

This is enough.

No Docker Hub.

No GitHub Actions.

No CI/CD complexity.

---

For Learning DevOps Later

Use:

```text
GitHub
↓
GitHub Actions
↓
Docker Hub
↓
Render
```

because this demonstrates:

* CI/CD
* Docker
* Image Registry
* Deployment Pipelines

which are useful DevOps concepts.

---

# Complete Deployment Flow

Development

```text
My Laptop
↓
Spring Boot
↓
application-dev.properties
↓
Local PostgreSQL
```

---

Push Code

```text
GitHub Repository
```

---

Build

```text
Dockerfile
↓
Docker Image
```

---

Deploy

```text
Render
↓
Runs Docker Image
```

---

Runtime

```text
Render Environment Variables
↓
Spring Boot
↓
Database Connection
```

---

# Mental Model

If I only remember one thing:

```text
Environment Variables
=
Secrets

Profiles
=
Different Configurations

Dockerfile
=
Recipe

Docker Image
=
Packaged Application

Docker Hub
=
Image Storage

GitHub Actions
=
Automation

Render
=
Runs Application
```

Everything else is built on top of these concepts.
