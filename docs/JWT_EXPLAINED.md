# JSON Web Tokens (JWT) Explained

This document explains what a JWT is, why it exists, and how TeamVault uses it for stateless authentication.

> [!NOTE]
> This document focuses on the *concepts* of JWTs. To see how these concepts are actually implemented using filters in Spring Boot, see [SPRING_SECURITY.md](https://github.com/nitin-is-me/TeamVault/tree/master/docs/SPRING_SECURITY.md).

---

## 1. Authentication vs. Authorization

Before understanding JWTs, you must understand the difference between two critical concepts:

- **Authentication:** Proving *who* you are. (e.g., Logging in with an email and password).
- **Authorization:** Checking *what* you are allowed to do. (e.g., Checking if you have the permission to edit a specific project).

JWTs are primarily used to maintain **Authentication** after the initial login.

---

## 2. Why do JWTs exist? (The Problem)

Imagine a user logs in to TeamVault:

```http
POST /api/auth/login
{
  "email": "nitin@gmail.com",
  "password": "password123"
}
```

The server verifies the password and says, "Yes, this is Nitin."
But HTTP is a **stateless** protocol. The server instantly forgets who Nitin is the moment the response is sent.

When Nitin subsequently tries to load his dashboard:

```http
GET /api/projects
```

How does the server know this request belongs to Nitin?

### The Old Way: Session Cookies (Stateful)
Historically, the server would generate a random "Session ID", save it in a server-side database/memory, and give it to the browser as a cookie. For every future request, the server would look up the Session ID in its database to figure out who the user is. 

**Problem:** If you have millions of users, storing sessions takes up a lot of server memory. If you have multiple servers behind a load balancer, they all need to share the same session database.

### The Modern Way: JWTs (Stateless)
With JWT, the server doesn't remember *anything*. Instead, it gives the user a cryptographically signed "ID card" (the token). The user shows this ID card on every request. The server just verifies the signature on the card to ensure it hasn't been tampered with.

---

## 3. What is a JWT Structure?

A JWT is a long string that looks like this: `xxxxx.yyyyy.zzzzz`

It consists of three parts separated by dots:

1. **Header (`xxxxx`):** Contains metadata about the token, like the algorithm used to sign it (e.g., HS256).
2. **Payload (`yyyyy`):** Contains the actual data (called "claims"). For TeamVault, this contains the user's email (`sub` claim) and the expiration time (`exp` claim).
3. **Signature (`zzzzz`):** A cryptographic hash of the Header, the Payload, and a secret key known *only* to the server.

Because the payload is just Base64 encoded JSON, **anyone can read a JWT**. Never put passwords or highly sensitive data inside a JWT payload!

---

## 4. The Complete Login Flow

Here is how TeamVault handles a user session from start to finish:

### Step 1: Login
1. The user submits their email and password to the `/api/auth/login` endpoint.
2. The server hashes the password and compares it to the database.
3. If valid, the server generates a new JWT. The payload contains the user's email.
4. The server signs the JWT using its secret key (defined in `application.properties`).
5. The server sends the JWT back to the client.

### Step 2: Storage
The client (React/Next.js) receives the JWT and stores it (usually in `localStorage` or an HTTP-only cookie).

### Step 3: Subsequent Requests
1. When the user wants to fetch their projects, the client attaches the JWT to the HTTP request in the Authorization header:
   ```http
   Authorization: Bearer <token>
   ```

### Step 4: Token Validation
1. The server intercepts the request and extracts the token.
2. The server recalculates the signature using its secret key. 
3. If the signatures match, the server knows the token is authentic and hasn't been tampered with.
4. The server checks the `exp` (expiration) claim to ensure the token hasn't expired.
5. The server extracts the email from the payload, identifies the user, and processes the request.

If the user alters the payload (e.g., changes their email to "admin@teamvault.com"), the signature will instantly become invalid, and the server will reject the request with a `403 Forbidden`.
