# DTOs, Controllers and Services in TeamVault

## Why am I writing this?

Coming from Express.js, Spring Boot initially felt confusing because there are many extra classes:

* DTOs
* Controllers
* Services
* Repositories
* Entities

In Express, I often wrote everything directly inside route handlers.

Example:

```js
app.post("/login", async (req, res) => {
    const user = await User.findOne({
        email: req.body.email
    });

    // authentication logic

    res.json(token);
});
```

Spring Boot encourages separating responsibilities into different layers.

This document explains why.

---

# High Level Flow

When a user logs in:

```text
Client
   |
   v
Controller
   |
   v
Service
   |
   v
Repository
   |
   v
Database
```

Response travels back through the same layers.

---

# What is a DTO?

DTO means:

```text
Data Transfer Object
```

A DTO is an object whose only purpose is moving data between layers.

It is NOT a database table.

It is NOT business logic.

It is just a container for data.

---

# AuthenticationRequest DTO

File:

```java
AuthenticationRequest.java
```

Contains:

```java
private String email;
private String password;
```

This represents the data a client sends when logging in.

Example request:

```json
{
  "email": "nitin@gmail.com",
  "password": "123456"
}
```

Spring automatically converts this JSON into:

```java
AuthenticationRequest request
```

inside the controller.

---

# Why not use User Entity directly?

Suppose our User entity looks like:

```java
public class User {
    private Long id;
    private String name;
    private String email;
    private String passwordHash;
}
```

The login endpoint only needs:

```text
email
password
```

Using the entire User entity would:

* expose unnecessary fields
* create tighter coupling
* make validation harder

DTOs keep APIs clean.

---

# Validation

Inside AuthenticationRequest:

```java
@NotBlank
@Email
private String email;

@NotBlank
private String password;
```

These rules are automatically checked by Spring.

Invalid request:

```json
{
  "email": "",
  "password": ""
}
```

Controller never executes.

Spring returns validation errors automatically.

This keeps controllers cleaner.

---

# AuthenticationResponse DTO

File:

```java
AuthenticationResponse.java
```

Contains:

```java
private String token;
```

Example response:

```json
{
  "token": "eyJhbGciOi..."
}
```

Notice that we are NOT returning:

```json
{
  "passwordHash": "...",
  "email": "...",
  "id": ...
}
```

Only the data needed by the client is returned.

This is another benefit of DTOs.

---

# Why RegisterRequest Exists But RegisterResponse Doesn't

Registration requires unique input:

```json
{
  "name": "Nitin",
  "email": "nitin@gmail.com",
  "password": "123456"
}
```

So we need:

```java
RegisterRequest
```

However, registration and login both return:

```json
{
  "token": "..."
}
```

Since both return the same structure, we reuse:

```java
AuthenticationResponse
```

instead of creating a separate RegisterResponse.

---

# What is a Controller?

Controller is the entry point for HTTP requests.

Example:

```java
@PostMapping("/login")
public ResponseEntity<AuthenticationResponse> authenticate(
        @Valid @RequestBody AuthenticationRequest request
)
```

Responsibilities:

* Receive HTTP requests
* Validate input
* Call services
* Return HTTP responses

Controllers should stay thin.

Controllers should NOT contain heavy business logic.

---

# What is a Service?

Example:

```java
AuthenticationService
```

This is where business logic lives.

Example:

```java
public AuthenticationResponse authenticate(
        AuthenticationRequest request
)
```

Responsibilities:

* Authenticate users
* Generate JWTs
* Perform application logic
* Coordinate repositories

Services answer:

```text
What should happen?
```

Controllers answer:

```text
Which endpoint was called?
```

---

# What is a Repository?

Repository talks to the database.

Example:

```java
UserRepository
```

Usage:

```java
repository.findByEmail(...)
repository.save(...)
```

Responsibilities:

* Read data
* Save data
* Delete data

Repositories should not contain business logic.

---

# What Happens During Login?

Step 1

Client sends:

```json
{
  "email": "nitin@gmail.com",
  "password": "123456"
}
```

Step 2

Spring converts JSON into:

```java
AuthenticationRequest
```

Step 3

Controller receives it:

```java
authenticate(request)
```

Step 4

Controller calls:

```java
service.authenticate(request)
```

Step 5

Service authenticates user:

```java
authenticationManager.authenticate(...)
```

Step 6

Service loads user:

```java
repository.findByEmail(...)
```

Step 7

JWT token generated:

```java
jwtService.generateToken(...)
```

Step 8

Response returned:

```java
AuthenticationResponse
```

Step 9

Spring converts object to JSON:

```json
{
  "token": "..."
}
```

---

# Comparison With Express

Express:

```js
app.post("/login", async (req, res) => {

    const user = await User.findOne(...);

    // authentication

    const token = createToken();

    res.json({ token });
});
```

Everything happens inside one function.

---

Spring:

Controller:

```java
authenticate(request)
```

↓

Service:

```java
authenticate(...)
```

↓

Repository:

```java
findByEmail(...)
```

↓

Response DTO:

```java
AuthenticationResponse
```

More files.

More structure.

But much easier to maintain when projects become large.

---

# Mental Model

Think of Spring Boot like:

```text
Controller
=
Traffic Police

Service
=
Decision Maker

Repository
=
Database Worker

DTO
=
Data Container

Entity
=
Database Object
```

If I remember only one thing:

```text
DTO = Data moving through the application

Entity = Data stored in the database
```

That distinction alone explains most Spring Boot project structures.