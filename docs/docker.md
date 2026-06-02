# Docker and CI/CD Pipeline Explanation

This document breaks down the exact syntax, purpose, and mechanics of the two core files powering TeamVault's deployment: the `Dockerfile` and the GitHub Actions `docker.yml` workflow.

---

## 1. The `Dockerfile`
**Location:** `server/Dockerfile`

A `Dockerfile` is a blueprint. It tells the Docker engine exactly how to build a custom Image containing our application. We use a **"multi-stage build"**, which means we use a heavy image to compile our code, but only keep the lightweight runtime for the final product.

### Stage 1: The Build Stage
```dockerfile
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
```
- **`FROM`**: Every Dockerfile must start with `FROM`. It pulls a pre-existing "base image" from Docker Hub.
- **`maven:3.9.6-eclipse-temurin-21-jammy`**: We are pulling an official Linux image that has Maven 3.9.6 and Java 21 pre-installed.
- **`AS build`**: We are naming this temporary stage "build" so we can refer to it later.

```dockerfile
WORKDIR /app
```
- **`WORKDIR`**: Sets the default directory inside the container. All subsequent commands will be run inside `/app` instead of the root `/`.

```dockerfile
COPY pom.xml .
COPY src ./src
```
- **`COPY`**: Takes files from your physical computer (the "host") and copies them into the container's `/app` folder. We copy the Maven dependencies (`pom.xml`) and our Java code (`src/`).

```dockerfile
RUN mvn clean package -DskipTests
```
- **`RUN`**: Executes a terminal command *inside* the container during the image building process. Here, it runs Maven to compile our `.java` files into a `.jar` file.
- **`-DskipTests`**: We skip tests so it doesn't crash trying to connect to a database that doesn't exist during the build phase.

### Stage 2: The Runtime Stage
```dockerfile
FROM eclipse-temurin:21-jre-jammy
```
- **`FROM`**: We start a brand new, completely empty stage based on a much smaller image that only contains the Java Runtime Environment (JRE), *not* Maven or the JDK. This keeps our final image tiny and fast.

```dockerfile
WORKDIR /app
```
- **`WORKDIR`**: Move into `/app` in this new stage.

```dockerfile
COPY --from=build /app/target/*.jar app.jar
```
- **`COPY --from=build`**: This is the magic of multi-stage builds! It goes back to the temporary stage we named "build", grabs the compiled `.jar` file, and drops it into our new tiny image, renaming it to `app.jar`. The entire Maven source code is discarded.

```dockerfile
EXPOSE 8080
```
- **`EXPOSE`**: This is mainly documentation. It tells Render and Docker that our application will be listening for traffic on port 8080.

```dockerfile
ENTRYPOINT ["java", "-jar", "app.jar"]
```
- **`ENTRYPOINT`**: The default command that runs when the container is actually started (via `docker run`). This is what boots up the Spring Boot server.

---

## 2. GitHub Actions Workflow (`docker.yml`)
**Location:** `.github/workflows/docker.yml`

This file is written in YAML. It tells GitHub's servers to automatically do work for us whenever an event happens.

### The Trigger
```yaml
name: Build and Push Docker Image
```
- **`name`**: The human-readable name of this workflow that shows up in the GitHub Actions dashboard.

```yaml
on:
  push:
    branches:
      - master
    paths:
      - 'server/**'
```
- **`on`**: Defines *when* this workflow should trigger.
- **`push:`**: Trigger on git push.
- **`branches: - master`**: Only trigger if the push is on the `master` branch.
- **`paths: - 'server/**'`**: Crucial optimization. Only trigger if a file inside the `server/` directory was changed. If we only change the frontend, don't waste time rebuilding the backend Docker image!

### The Jobs
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
```
- **`jobs`**: The actual work to be done.
- **`runs-on: ubuntu-latest`**: GitHub spins up a fresh, empty Ubuntu Linux Virtual Machine in the cloud to run our steps.

### The Steps
```yaml
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
```
- **`steps`**: The sequence of commands to run on the Ubuntu VM.
- **`uses: actions/checkout@v3`**: This is a pre-written script provided by GitHub. It essentially runs `git clone` to pull your repository's code into the empty Ubuntu VM.

```yaml
      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
```
- **`uses: docker/login-action@v2`**: Another pre-written script that securely logs the Ubuntu VM into your Docker Hub account.
- **`${{ secrets.XXX }}`**: This syntax reads the hidden secrets you configured in the GitHub Settings UI so they aren't exposed in your code.

```yaml
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: ./server
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/teamvault-server:latest
```
- **`uses: docker/build-push-action@v4`**: The script that actually runs Docker.
- **`context: ./server`**: Tells Docker to look for the `Dockerfile` inside the `server/` directory.
- **`push: true`**: After building the image, automatically upload it to Docker Hub.
- **`tags:`**: Names the image in Docker Hub (e.g., `nitin-is-me/teamvault-server:latest`).
