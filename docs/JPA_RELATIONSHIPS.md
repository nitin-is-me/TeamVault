# How JPA Relationships Actually Work Internally

This section exists because I understood tables and relationships, but I still got confused when I saw code like:

```java
SELECT pm.project
FROM ProjectMember pm
WHERE pm.user = :user
```

My confusion was:

> "ProjectMember table only stores project_id and user_id. It does NOT store Project objects or User objects. So how can JPQL access pm.project and pm.user?"

This question led me to understanding what an ORM actually does.

---

# Database View vs Java View

The most important thing to understand:

The database and Java see the same data differently.

Database View:

```text
project_members

id
project_id
user_id
role
```

Java View:

```java
public class ProjectMember {

    private Long id;

    private Project project;

    private User user;

    private Role role;
}
```

These are describing the SAME thing.

The database stores IDs.

Java works with objects.

Hibernate translates between them.

---

# The Magic Is Not Magic

Suppose we write:

```java
@ManyToOne
@JoinColumn(name = "project_id")
private Project project;
```

This annotation tells Hibernate:

```text
When someone accesses project,
look at project_id column
and connect it to a Project.
```

Similarly:

```java
@ManyToOne
@JoinColumn(name = "user_id")
private User user;
```

means:

```text
When someone accesses user,
look at user_id column
and connect it to a User.
```

---

# Visual Example

Database:

Projects

```text
id | name
---------
1  | TeamVault
```

Users

```text
id | name
---------
5  | Nitin
```

ProjectMembers

```text
id | project_id | user_id
-------------------------
1  |     1      |    5
```

---

Java View

Hibernate converts this row into something that behaves like:

```java
ProjectMember pm = new ProjectMember();

pm.id = 1;

pm.project = TeamVault Project Object;

pm.user = Nitin User Object;
```

Notice:

```text
project_id = 1
```

became:

```java
pm.project
```

and:

```text
user_id = 5
```

became:

```java
pm.user
```

This transformation is the entire purpose of an ORM.

> [!NOTE]
> For details on how to query these objects using JPQL, see [SPRING_DATA_JPA.md](https://github.com/nitin-is-me/TeamVault/tree/master/docs/SPRING_DATA_JPA.md).

# What Problem Is Hibernate Solving?

Without Hibernate:

```java
SELECT *
FROM project_members
```

returns:

```text
project_id = 1
user_id = 5
```

Then I must manually:

```java
findProjectById(1)
findUserById(5)
```

for every row.

That becomes painful.

Hibernate automates this process.

---

# Why We Write pm.project Instead Of pm.projectId

Many beginners expect:

```java
private Long projectId;
```

instead of:

```java
private Project project;
```

because that's what exists in the database.

However:

```java
private Project project;
```

is far more useful.

Now I can write:

```java
pm.getProject().getName()
```

instead of:

```java
projectRepository.findById(
    pm.getProjectId()
);
```

everywhere.

---

# Thinking Like SQL

Suppose I see:

```java
pm.user
```

I should mentally translate it to:

```text
user_id foreign key
→ users table
→ actual User
```

Suppose I see:

```java
pm.project
```

I should mentally translate it to:

```text
project_id foreign key
→ projects table
→ actual Project
```

This mental translation helps me understand JPQL.

---

# Why Does JPA Feel Strange Coming From Express?

In Express and Node.js I often think like this:

```text
Table
↓
Row
↓
ID
↓
Manual Query
```

Example:

```js
const project = await db.query(
    "SELECT * FROM projects WHERE id = ?"
);
```

Everything revolves around IDs.

---

JPA encourages:

```text
Object
↓
Relationship
↓
Object
```

Example:

```java
projectMember.getProject()
```

instead of:

```java
projectRepository.findById(
    projectMember.getProjectId()
)
```

The ORM handles the lookup.

---

# Final Mental Model

Database thinks:

```text
project_id
user_id
```

Java thinks:

```java
project
user
```

Hibernate translates between those two worlds.

Whenever I see:

```java
pm.project
```

I should remember:

```text
There is no project column.

There is a project_id column.

Hibernate is converting that foreign key
into a Project object for me.
```

That single realization explains most of JPA.
