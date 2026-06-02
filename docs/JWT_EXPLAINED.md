# JWT Authentication in Spring Boot Explained for an Express Developer

## First: What problem are we solving?

Imagine a user logs in.

```http
POST /login
```

with:

```json
{
  "email": "nitin@gmail.com",
  "password": "password123"
}
```

Server verifies credentials.

Now what?

How does the server remember that this user is logged in on future requests?

Example:

```http
GET /projects
```

How does Spring know this request belongs to Nitin?

The answer is:

```text
JWT Token
```

---

# How it usually feels in Express

You probably did something like:

```js
const token = jwt.sign(
  { email: user.email },
  SECRET
);
```

Later:

```js
const decoded = jwt.verify(token, SECRET);
```

That's basically it.

Very little code.

---

# What Spring does

Spring breaks the same process into multiple classes.

Instead of:

```text
1 file
```

you get:

```text
JwtService
JwtAuthenticationFilter
SecurityConfig
```

This feels bigger, but each class has one responsibility.

---

# BIG PICTURE

User logs in

↓

Spring generates token

↓

User stores token

↓

User sends token on future requests

↓

Spring reads token

↓

Spring finds user

↓

Spring marks request as authenticated

↓

Controller executes

That's literally the entire system.

---

# SecurityConfig

Start here.

This is the boss.

```java
.requestMatchers("/api/auth/**").permitAll()
```

Means:

```text
Anybody can access login/register.
```

Because how would you login otherwise?

---

```java
.anyRequest().authenticated()
```

Means:

```text
Everything else requires login.
```

Example:

```http
GET /projects
```

Requires authentication.

---

This line:

```java
.addFilterBefore(
    jwtAuthFilter,
    UsernamePasswordAuthenticationFilter.class
)
```

Means:

```text
Before protected requests,
run JwtAuthenticationFilter.
```

Think:

```js
app.use(authMiddleware)
```

from Express.

Same idea.

---

# JwtAuthenticationFilter

This is the middleware.

Every request passes through here.

Example request:

```http
GET /projects

Authorization:
Bearer abc123xyz
```

---

Step 1

```java
request.getHeader("Authorization")
```

Reads:

```http
Authorization:
Bearer abc123xyz
```

---

Step 2

```java
jwt = authHeader.substring(7);
```

Removes:

```text
Bearer
```

Leaving:

```text
abc123xyz
```

which is the token.

---

Step 3

```java
userEmail =
    jwtService.extractUsername(jwt);
```

Spring asks:

```text
Who owns this token?
```

Result:

```text
nitin@gmail.com
```

---

Step 4

```java
userDetailsService
    .loadUserByUsername(userEmail);
```

Spring now loads user from database.

Equivalent Express:

```js
User.findOne({
 email
})
```

---

Step 5

```java
jwtService.isTokenValid(...)
```

Checks:

```text
Is token genuine?
Has it expired?
Does it belong to this user?
```

---

Step 6

If valid:

```java
SecurityContextHolder
    .getContext()
    .setAuthentication(...)
```

THIS IS THE MOST IMPORTANT LINE.

This is basically:

```js
req.user = user;
```

from Express.

Everything before this was preparation.

This line tells Spring:

```text
This request belongs to Nitin.
```

Now Spring considers request authenticated.

---

# JwtService

This class only does one thing:

```text
Work with JWT tokens.
```

Generate them.

Read them.

Validate them.

That's all.

---

# Why two generateToken methods?

Java supports something called:

```text
Method Overloading
```

Meaning:

```java
print("hello")

print("hello", 5)
```

can both exist.

Same name.

Different parameters.

---

Method 1

```java
generateToken(userDetails)
```

Simple version.

---

Method 2

```java
generateToken(
 extraData,
 userDetails
)
```

Advanced version.

---

Method 1 actually calls Method 2.

```java
return generateToken(
    new HashMap<>(),
    userDetails
);
```

Meaning:

```text
Generate token with no extra data.
```

---

# What is this HashMap thing?

Ignore JWT terminology.

Think:

```java
Map<String,Object>
```

as:

```text
Extra information.
```

Example:

```java
{
 "role":"ADMIN"
}
```

or

```java
{
 "department":"HR"
}
```

You are not using it.

So Spring sends:

```java
new HashMap<>()
```

which means:

```text
No extra information.
```

Empty map.

---

# Token Generation

This code:

```java
Jwts.builder()
```

Means:

```text
Start creating a token.
```

---

This:

```java
.setSubject(
    userDetails.getUsername()
)
```

Means:

```text
Store user's email inside token.
```

Example:

```text
nitin@gmail.com
```

---

This:

```java
.setIssuedAt(...)
```

Means:

```text
When token was created.
```

---

This:

```java
.setExpiration(...)
```

Means:

```text
When token dies.
```

---

This:

```java
.signWith(...)
```

Means:

```text
Lock token using secret key.
```

Without this step:

Anybody could edit token.

Bad.

---

This:

```java
.compact()
```

Means:

```text
Convert everything
into final JWT string.
```

Done.

---

# Why do we need secret key?

Imagine token contains:

```text
nitin@gmail.com
```

Attacker changes it to:

```text
admin@gmail.com
```

Without secret key:

Server would trust it.

Bad.

---

Secret key creates a signature.

If token changes:

Signature breaks.

Spring rejects token.

That's why secret key exists.

---

# What is getSignInKey()

This method:

```java
private Key getSignInKey()
```

simply converts:

```text
Secret String
```

into:

```text
Java Key Object
```

because JWT library requires that format.

Nothing magical.

---

# What is extractUsername()

Given token:

```text
abc123xyz
```

Return:

```text
nitin@gmail.com
```

That's literally all.

---

# What is extractClaim()

Bad method name for beginners.

Think:

```text
Extract a piece of information
from token.
```

Example:

```java
extractUsername(...)
```

returns email.

Example:

```java
extractExpiration(...)
```

returns expiry date.

Same helper method.

Different information.

---

# What is extractAllClaims()

Again, terrible name.

Think:

```text
Open token.
Read everything inside.
Return all information.
```

That's it.

---

# What is isTokenValid()

Checks:

1. Same user?
2. Not expired?

If yes:

```java
true
```

Else:

```java
false
```

Done.

---

# Final Mental Model

Express:

```js
jwt.sign()

jwt.verify()

authMiddleware()

req.user = user
```

Spring:

```java
JwtService.generateToken()

JwtService.isTokenValid()

JwtAuthenticationFilter

SecurityContextHolder
    .setAuthentication(...)
```

Same idea.

More classes.

More structure.

But fundamentally doing the exact same thing.
