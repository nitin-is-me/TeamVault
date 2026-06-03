# Spring Data JPA Explained

This document explains what Spring Data JPA is, how it differs from Hibernate, and how to use it to interact with the database.

> [!NOTE]
> This document assumes you understand how Entities and Relationships work. If you don't, please read [JPA_RELATIONSHIPS.md](https://github.com/nitin-is-me/TeamVault/tree/master/docs/JPA_RELATIONSHIPS.md) first.

---

## 1. JPA vs Hibernate vs Spring Data JPA

**JPA (Java Persistence API)**
JPA is just a specification. It's a set of rules (interfaces) defined by Java that describe how an ORM (Object-Relational Mapper) should work. It doesn't actually do anything on its own.

**Hibernate**
Hibernate is the actual implementation of JPA. It is the code that connects to the database, generates SQL, and maps rows to Java objects.

**Spring Data JPA**
Spring Data JPA is a layer built on top of Hibernate. It reduces boilerplate code by automatically generating implementations for your repositories. You write an interface, and Spring provides the actual code at runtime.

---

## 2. JpaRepository and CRUD Operations

Instead of writing SQL or Hibernate boilerplate for basic operations, you simply extend `JpaRepository`:

```java
public interface UserRepository extends JpaRepository<User, Long> {
}
```

By doing this, you instantly get access to standard CRUD (Create, Read, Update, Delete) methods:

- `save(entity)`: Inserts a new row or updates an existing one.
- `findById(id)`: Returns an `Optional<Entity>`.
- `findAll()`: Returns a list of all rows.
- `deleteById(id)`: Deletes the row with the given ID.

### The `Optional` Wrapper
When you call `findById`, it returns `Optional<User>` instead of `User`. This is Java's way of avoiding `NullPointerException`. It forces you to handle the case where the user might not exist:

```java
User user = userRepository.findById(1L)
    .orElseThrow(() -> new RuntimeException("User not found"));
```

---

## 3. Derived Query Methods

Spring Data JPA has a feature called "Query Derivation". You can define a method signature, and Spring will automatically generate the SQL based on the method's name.

```java
// Spring generates: SELECT * FROM users WHERE email = ?
Optional<User> findByEmail(String email);

// Spring generates: SELECT * FROM users WHERE name = ? AND status = ?
List<User> findByNameAndStatus(String name, String status);
```

---

## 4. JPQL (Java Persistence Query Language)

When a query is too complex for method names, you use JPQL.

JPQL is NOT SQL.
JPQL works with **Java objects**.
SQL works with **tables**.

If you have a `ProjectMember` entity with a `Project` field, you query the object:

```java
@Query("SELECT pm.project FROM ProjectMember pm WHERE pm.user = :user")
List<Project> findProjectsByUser(@Param("user") User user);
```

### Why JPQL Looks Weird

JPQL:
```java
SELECT pm.project
FROM ProjectMember pm
```
looks at `private Project project;` inside the entity.

SQL would be closer to:
```sql
SELECT p.*
FROM project_members pm
JOIN projects p
ON pm.project_id = p.id
```

JPQL lets us think in objects instead of joins. Hibernate is simply generating the JOIN behind the scenes.

---

## 5. Native Queries

If you need to use database-specific features (like PostgreSQL JSONB functions) that JPQL doesn't support, you can write native SQL:

```java
@Query(value = "SELECT * FROM users WHERE email LIKE %?1%", nativeQuery = true)
List<User> findUsersByEmailDomain(String domain);
```
> [!WARNING]
> Native queries bypass the ORM. You should only use them when JPQL is absolutely insufficient.

---

## 6. Lazy vs Eager Loading

When you load an entity that has relationships, Hibernate has to decide whether to fetch the related entities immediately or wait.

### Eager Loading (`FetchType.EAGER`)
Hibernate runs a massive JOIN and fetches everything at once.
- **Pros:** Data is immediately available.
- **Cons:** Bad performance if you load 100 projects and each loads 100 members. It fetches 10,000 rows unexpectedly.

### Lazy Loading (`FetchType.LAZY`)
Hibernate puts a "proxy" object in place of the relationship. It doesn't query the database until you actually call a getter (e.g., `project.getMembers()`).
- **Pros:** Excellent performance. Only fetches data when explicitly requested.
- **Cons:** If you call the getter after the database transaction is closed, you get a `LazyInitializationException`.

> [!TIP]
> **Best Practice:** Default to `LAZY` for all `@OneToMany` and `@ManyToMany` relationships to protect database performance.
