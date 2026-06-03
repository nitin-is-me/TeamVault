# Spring Security Explained

This document explains the internal mechanisms of Spring Security and how it protects TeamVault endpoints.

> [!NOTE]
> This document assumes you understand the basics of JWTs and authentication flows. If you need a refresher, read [JWT_EXPLAINED.md](https://github.com/nitin-is-me/TeamVault/tree/master/docs/JWT_EXPLAINED.md).

---

## 1. SecurityFilterChain

The `SecurityFilterChain` is the boss of Spring Security. It determines what routes require authentication and what rules apply.

In `SecurityConfig.java`:

```java
.requestMatchers("/api/auth/**").permitAll()
```
This means anybody can access the login and registration endpoints. If this wasn't permitted, you could never log in!

```java
.anyRequest().authenticated()
```
This means everything else (e.g., `/api/projects`) requires a valid authentication token.

---

## 2. The Request Lifecycle (Filters)

Spring Security is essentially a chain of filters. When a request hits your server, it passes through these filters before it ever reaches your Controller.

```text
Request → Filter 1 → Filter 2 → JwtAuthenticationFilter → Controller
```

By default, Spring Security uses a `UsernamePasswordAuthenticationFilter` which expects a username and password in a form submission. We are building a modern API, so we use JWTs instead.

We tell Spring to intercept requests *before* the default filter using:
```java
.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
```

### JwtAuthenticationFilter

This is our custom middleware. Every request passes through here.

1. **Extract Token**: It reads the `Authorization: Bearer <token>` header.
2. **Extract Username**: It calls `jwtService.extractUsername(jwt)`.
3. **Load User**: It calls `UserDetailsService` to fetch the user from the database.
4. **Validate**: It checks if the token is valid and not expired.

If the token is valid, it executes the most important line in the whole authentication process:

```java
SecurityContextHolder.getContext().setAuthentication(authToken);
```
This is the Spring equivalent of doing `req.user = user` in Express. It tells the rest of the application: "This request is officially authenticated, let it through."

---

## 3. AuthenticationManager & AuthenticationProvider

When a user tries to log in (by submitting an email and password to the `/login` endpoint), the `AuthenticationService` asks the `AuthenticationManager` to verify the credentials.

```java
authenticationManager.authenticate(
    new UsernamePasswordAuthenticationToken(email, password)
)
```

The `AuthenticationManager` delegates this work to an `AuthenticationProvider` (specifically a `DaoAuthenticationProvider`).

The `AuthenticationProvider` does two things:
1. It uses the `UserDetailsService` to fetch the User object from the database using the provided email.
2. It uses the `PasswordEncoder` (e.g., BCrypt) to hash the provided password and compare it against the hash stored in the database.

If they match, the user is authenticated, and we can generate a JWT for them. If they don't, it throws a `BadCredentialsException` (HTTP 403 Forbidden).

---

## 4. Why all these interfaces?

Coming from Express, this seems like an overwhelming number of classes just to check a password. Why do we need `UserDetailsService`, `AuthenticationManager`, `AuthenticationProvider`, and `PasswordEncoder`?

Because Spring Security is **pluggable**.

- Want to fetch users from a database? Provide a custom `UserDetailsService`.
- Want to fetch users from Active Directory (LDAP)? Swap the `AuthenticationProvider`.
- Want to use Argon2 instead of BCrypt? Swap the `PasswordEncoder`.

You don't have to rewrite the core authentication logic; you just plug in the pieces you need.
