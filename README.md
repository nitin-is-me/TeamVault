<img width="926" height="300" alt="image" src="https://github.com/user-attachments/assets/60a976d7-a007-4c8e-8c19-2a9534c35f63" />

# TeamVault

so this is why i started this project... during my software engineering internships, i noticed that whenever a new guy joins the team or takes over a project, they spend like 90% of their time just trying to find setup instructions, random database credentials, or figuring out why something keeps crashing lol. 

all this knowledge was scattered across random slack threads, messy google docs or comments in code, and individual people's brains. I actually had to write a huge doc for the next intern before I left, and it made me realize how much valuable knowledge just disappears when people leave or move projects.

so I thought, why not build a focused, simple knowledge sharing platform for small teams? not a massive bloated thing, just a lightweight and clean place to save project docs so that it actually helps the next guy and we can just invite them to the project. It'll be also helpful for solo projects where you just want a separate space for your projects and all documentations linked to it so you don't have to upload a .md file everytime you update your project.

### Goal
to build a simple, focused knowledge-sharing hub for small teams where you can actually find the documentation you need without struggling for random flows and info. also using this to properly learn Spring Boot!

---

## Features
### Account creation
You don't need to verify an email (yet) or anything complicated. Just enter your name, email, and password to create an account and you're in. 

### Secure Projects
You can create separate projects (like "Backend Refactor" or "Frontend Configs"). Since everything is secured with JWT authentication, random people can't see your stuff unless they log in.

### Write documentation without hassle
You can write knowledge articles inside your projects. The coolest part? It supports full Markdown with preview! So you can write bold text, headings, lists, and even code blocks to make your docs look professional and actually readable. Plus, you can easily edit articles later if you make a typo.

### Team Collaboration & RBAC
The biggest update! You can now invite team members to your projects using just their email address. It has Role Based Access Control (RBAC) implemented, which means you can decide if the invited user can edit the project articles or not. Only the project owner can invite other users to the project. Your dashboard automatically shows projects you created alongside projects you were invited to.

### Scalable and strong database
I used Spring Boot with PostgreSQL. I could have just built a messy backend, but using Spring Boot ensures the application is actually scalable and follows proper architectural patterns, which is exactly what I wanted to learn instead of having to write dozens of controllers again in express which is surely faster but not scalable lol.

### Clean and Premium UI
The frontend is built with Next.js and Tailwind CSS. I added a premium dark mode theme with glassmorphism effects because honestly, developers hate reading documentation on ugly websites.

---

### For Nerds (Architecture & Deployment)
I wanted this project to reflect modern industry standards, so the deployment pipeline is completely automated:
- **Backend Stack:** Java 21, Spring Boot 3, Spring Security (JWT), PostgreSQL (Supabase).
- **Frontend Stack:** Next.js (App Router), React, Tailwind CSS, Axios.
- **Dockerized Environment:** The Spring Boot backend is containerized using a highly optimized, multi-stage `Dockerfile`. It builds a lightweight Eclipse Temurin JRE image, keeping the final container incredibly small.
- **CI/CD Pipeline:** Configured with **GitHub Actions**. Every push to the `master` branch automatically triggers a workflow that checks out the code, builds the Docker image, and pushes it to Docker Hub.
- **Cloud Hosting:** 
  - The backend image is pulled directly from Docker Hub and hosted on **Render** (I haven't implemented the webhooks for auto-pulling the image and deploying it). Environment variables are injected dynamically at runtime, keeping secrets completely out of the codebase.
  - The frontend is deployed on **Vercel**.

## Version History
| Version | Date       | Summary         |
|---------|------------|-----------------|
|1.0      | **01-Jun-2026** | First push. The project acts like a clean personal documentation saver. Basic features like authentication (JWT), project creation, and markdown article writing are added. |
|1.1      | **02-Jun-2026** | Big Update: Implemented Project Invitations and Role Based Access Control (RBAC). Now you can add team members to projects and collaborate. Also added article editing functionality, markdown preview and a unified omnibar to search globally across all your projects. |

--------------
### Contribute to the project
TeamVault is an open source project, hence it welcomes all improvements from anyone interested. New features will be coming soon, thanks!
