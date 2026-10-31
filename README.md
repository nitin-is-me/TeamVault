<img width="1241" height="497" alt="image" src="https://github.com/user-attachments/assets/0da44dae-3a8e-4b58-8e4b-595edfa236bd" />

# TeamVault
> Live website can be used [here](https://teamvault-web.vercel.app/)

So this is why i started this project... during my software engineering internships, i noticed that whenever a new guy joins the team or takes over a project, they spend like 90% of their time just trying to find setup instructions, random database credentials, or figuring out why something keeps crashing lol. 

all this knowledge was scattered across random slack threads, messy google docs or comments in code, and individual people's brains. I actually had to write a huge doc for the next intern before I left, and it made me realize how much valuable knowledge just disappears when people leave or move projects.

so I thought, why not build a focused, simple knowledge sharing platform for small teams? not a massive bloated thing, just a lightweight and clean place to save project docs so that it actually helps the next guy and we can just invite them to the project. It'll be also helpful for solo projects where you just want a separate space for your projects and all documentations linked to it so you don't have to upload a .md file everytime you update your project.

### Goal
to build a simple, focused knowledge-sharing hub for small teams where you can actually find the documentation you need without struggling for random flows and info. also using this to properly learn Spring Boot!

---

## Features
### Account creation
Sign up with your name, email, and password. TeamVault emails you a 6-digit one-time code through Brevo, and your account activates as soon as you enter it. Codes expire after 10 minutes, allow 5 attempts, and can be resent after a short cooldown. Accounts created before email verification existed are marked as verified.

### Secure Projects
You can create separate projects (like "Backend Refactor" or "Frontend Configs"). Since everything is secured with JWT authentication, random people can't see your stuff unless they log in.

### Write documentation without hassle
You can write knowledge articles inside your projects. The coolest part? It supports full Markdown with preview! So you can write bold text, headings, lists, and even code blocks to make your docs look professional and actually readable. Plus, you can easily edit articles later if you make a typo.

### Article Version History & Visual Diffs
Never worry about losing past edits or accidental overwrites. Every time an article is updated, TeamVault automatically snapshots an immutable revision checkpoint. You can open the version timeline, inspect visual green (`+`) / red (`-`) line-by-line diffs against current or previous versions, preview historical snapshots in Markdown, and restore an older version with a single click (secured by RBAC).

### Team Collaboration & RBAC
The biggest update! You can now invite team members to your projects using just their email address. It has Role Based Access Control (RBAC) implemented, which means you can decide if the invited user can edit the project articles or not. Only the project owner can invite other users to the project. Your dashboard automatically shows projects you created alongside projects you were invited to.

### Scalable and strong database
I used Spring Boot with PostgreSQL. I could have just built a messy backend, but using Spring Boot ensures the application is actually scalable and follows proper architectural patterns, which is exactly what I wanted to learn instead of having to write dozens of controllers again in express which is surely faster but not scalable lol.

### Clean and Premium UI
The frontend is built with Next.js and Tailwind CSS. I added a premium dark mode theme with glassmorphism effects because honestly, developers hate reading documentation on ugly websites.

---

### For Nerds (Architecture & Deployment)
I wanted this project to reflect modern industry standards, so the deployment pipeline is completely automated:
- **Backend Stack:** Java 21, Spring Boot 4, Spring Security (JWT), PostgreSQL (Supabase).
- **Frontend Stack:** Next.js (App Router) + TypeScript, React, Tailwind CSS, Axios.
- **Dockerized Environment:** The Spring Boot backend is containerized using a highly optimized, multi-stage `Dockerfile`. It builds a lightweight Eclipse Temurin JRE image, keeping the final container incredibly small.
- **CI/CD Pipeline:** Configured with **GitHub Actions**. Every push and pull request runs the backend test suite (`mvnw verify`), frontend typecheck, and frontend production build. Pushes to `master` that change the backend also build and push the Docker image to Docker Hub.
- **Cloud Hosting:** 
  - The backend image is pulled directly from Docker Hub and hosted on **Render** (I haven't implemented the webhooks for auto-pulling the image and deploying it). Environment variables are injected dynamically at runtime, keeping secrets completely out of the codebase.
  - The frontend is deployed on **Vercel**.
- **Transactional Email:** Signup verification codes go out through **Brevo's HTTPS API**. Render blocks outbound SMTP, and Brevo only needs a verified sender address, so no custom domain is required. Required environment variables:
  ```text
  EMAIL_PROVIDER=brevo
  BREVO_API_KEY=xkeysib-...
  EMAIL_FROM=TeamVault <your-verified-sender@gmail.com>
  ```
  The sender email must match an address verified under Brevo's **Senders** settings; the display name can be anything.

## Version History
| Version | Date       | Summary         |
|---------|------------|-----------------|
|1.0.0      | **01-Jun-2026** | First push. The project acts like a clean personal documentation saver. Basic features like authentication (JWT), project creation, and markdown article writing are added. |
|1.1.0      | **02-Jun-2026** | Big Update: Implemented Project Invitations and Role Based Access Control (RBAC). Now you can add team members to projects and collaborate. Also added article editing functionality, markdown preview and a unified omnibar to search globally across all your projects. |
|1.2.0      | **01-Oct-2026** | Big Update: Article Version History & Rollback: Automatic revision checkpoints on article edits, green/red line-by-line visual diff viewer (powered by `diff`), historical Markdown previews, and one-click restore functionality with RBAC protection. |
|1.2.1      | **26-Oct-2026** | Mobile Responsive UI: the whole app now works properly on phones. Compact icon toolbars, full-width actions, swipeable revision timeline with wrapped diffs, and markdown that no longer overflows the screen. |
|1.3.0      | **31-Oct-2026** | Foundation hardening: consistent 400/401/403/404/409 API errors, JWT and CORS hardening, database constraints and optimistic locking, `GET /api/users/me`, project updates, UTC timestamps, search result caps, improved frontend error states, and a backend + frontend CI pipeline with automated tests. |
|1.4.0      | **31-Oct-2026** | Email verification: 6-digit OTP delivered through Brevo's HTTPS API (no domain required, SMTP-free for Render), hashed single-use codes with expiry and attempt limits, resend cooldown, verified-only login, and a dedicated verification screen. |

--------------
### Contribute to the project
TeamVault is an open source project, hence it welcomes all improvements from anyone interested. New features will be coming soon, thanks!
