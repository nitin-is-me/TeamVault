# Spring Security Explained

This document explains the internal mechanisms of Spring Security and how it protects TeamVault endpoints.

> [!NOTE]
> This document assumes you understand the basics of JWTs and authentication flows. If you need a refresher, read [JWT_EXPLAINED.md](https://github.com/nitin-is-me/TeamVault/tree/master/docs/JWT_EXPLAINED.md).

---

## 1. What Spring Security Is Actually Trying To Do

Coming from Express, Spring Security can feel extremely complicated for something that appears to be:

```js
const user = await User.findOne(...);
const match = await bcrypt.compare(...);
```

Spring Security is not just a password-checking library.

It is a complete authentication and authorization framework designed to support many authentication mechanisms:

* Username/password
* JWT
* OAuth2
* OpenID Connect (OIDC)
* LDAP
* SAML
* API Keys
* Custom authentication systems

Because of this, Spring Security is built around abstractions and interfaces instead of hardcoded login logic.

The goal is:

> "You provide the pieces. Spring Security provides the authentication engine."

---

## 2. SecurityFilterChain

The `SecurityFilterChain` is the boss of Spring Security. It determines what routes require authentication and what rules apply.

In `SecurityConfig.java`:

```java
.requestMatchers("/api/auth/**").permitAll()
```

This means anybody can access the login and registration endpoints. If this wasn't permitted, you could never log in.

```java
.anyRequest().authenticated()
```

This means everything else (e.g., `/api/projects`) requires a valid authentication token.

Think of `SecurityFilterChain` as Express middleware registration:

```js
app.use(authMiddleware);
app.use(routes);
```

except Spring Security manages many security-related filters automatically.

---

## 3. The Request Lifecycle (Filters)

Spring Security is essentially a chain of filters.

When a request hits your server, it passes through these filters before it ever reaches your Controller.

```text
Request
   ↓
Filter 1
   ↓
Filter 2
   ↓
JwtAuthenticationFilter
   ↓
Controller
```

This is very similar to Express middleware:

```text
Request
   ↓
Middleware
   ↓
Middleware
   ↓
Route Handler
```

---

## 4. JwtAuthenticationFilter

This is our custom authentication middleware.

Every request passes through here.

### Step 1: Extract Token

Read:

```http
Authorization: Bearer <token>
```

### Step 2: Extract Username

```java
jwtService.extractUsername(jwt)
```

### Step 3: Load User

```java
userDetailsService.loadUserByUsername(...)
```

### Step 4: Validate

Verify:

* Signature
* Expiration
* Ownership

### Step 5: Authenticate Request

```java
SecurityContextHolder
    .getContext()
    .setAuthentication(authToken);
```

This is the Spring equivalent of:

```js
req.user = user;
```

in Express.

Without this line, Spring Security still considers the request anonymous.

This is one of the most important lines in the entire authentication process.

---

## 5. AuthenticationManager

This is where many developers get confused.

The `AuthenticationManager` usually does not perform authentication itself.

Think of it as a traffic controller.

You give it an authentication request:

```java
authenticationManager.authenticate(
    new UsernamePasswordAuthenticationToken(
        email,
        password
    )
);
```

Its job is to find an `AuthenticationProvider` capable of handling that request.

Think:

```text
AuthenticationManager
        ↓
Chooses Provider
        ↓
Provider Authenticates
```

---

## 6. AuthenticationProvider

This is where the actual authentication work happens.

For username/password login, Spring commonly uses:

```java
DaoAuthenticationProvider
```

Its responsibilities:

### Load User

```java
userDetailsService.loadUserByUsername(...)
```

Equivalent Express logic:

```js
User.findOne(...)
```

### Verify Password

```java
passwordEncoder.matches(...)
```

Equivalent Express logic:

```js
bcrypt.compare(...)
```

### Return Result

If successful:

```text
Authenticated User
```

If unsuccessful:

```text
BadCredentialsException
```

---

## 7. UserDetailsService

Spring Security does not know where your users are stored.

They could be in:

* PostgreSQL
* MongoDB
* Redis
* LDAP
* Flat files

Spring has no way of knowing.

Therefore you must provide:

```java
loadUserByUsername(...)
```

This is simply Spring's way of asking:

> "Given this username/email, how do I find the user?"

Express equivalent:

```js
User.findOne(...)
```

---

## 8. UsernamePasswordAuthenticationToken

Despite the name, this is NOT a JWT.

This is simply a container object that holds authentication data.

Before authentication:

```java
new UsernamePasswordAuthenticationToken(
    email,
    password
)
```

contains:

```text
Principal   = email
Credentials = password
Authenticated = false
```

Think of it like:

```js
{
    email,
    password
}
```

with extra metadata attached.

---

## 9. Why Is It Called A Token?

The name is confusing.

In Spring Security:

```text
Authentication Token
```

means:

> "An object representing authentication information."

It does NOT necessarily mean:

```text
JWT
```

This terminology existed long before JWTs became popular.

---

## 10. Why Not Just authenticate(email, password)?

Because Spring Security supports many authentication types.

Examples:

* Username/password
* JWT
* OAuth2
* LDAP
* API Keys

Some authentication mechanisms do not even have a password.

Therefore Spring Security uses a generic abstraction:

```java
Authentication
```

instead of:

```java
authenticate(email, password)
```

This allows all authentication types to be processed through the same API.

---

## 11. Authentication Interface

`Authentication` is the common interface used by Spring Security.

Examples:

```java
UsernamePasswordAuthenticationToken
OAuth2AuthenticationToken
JwtAuthenticationToken
```

all implement:

```java
Authentication
```

This allows Spring Security to work with many authentication mechanisms using one common API.

---

## 12. SecurityContextHolder

This is where Spring stores information about the currently authenticated user.

After authentication:

```java
SecurityContextHolder
    .getContext()
    .setAuthentication(...)
```

Now Spring Security knows:

```text
Who is logged in
What roles they have
What authorities they have
```

Express equivalent:

```js
req.user = user;
```

Many Spring Security features depend on this object being populated correctly.

---

## 13. Why So Many Interfaces?

Coming from Express, this seems like an overwhelming number of classes just to check a password.

The answer is flexibility.

You can replace:

* UserDetailsService
* AuthenticationProvider
* PasswordEncoder

without rewriting the entire authentication system.

Spring Security trades simplicity for extensibility.

For a small project this can feel excessive.

For a large enterprise application supporting multiple authentication methods, it becomes extremely useful.
