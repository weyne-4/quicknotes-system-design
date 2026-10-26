# QuickNotes Data Model

## 1. Overview

QuickNotes is a note-taking application that allows users to create, retrieve, update, delete, and organize notes.

This document defines the proposed relational database model. It contains four tables:

1. `users` — stores user accounts.
2. `notes` — stores notes belonging to users.
3. `tags` — stores tags created by users.
4. `note_tags` — connects notes and tags through a many-to-many relationship.

The design uses primary keys, foreign keys, constraints, and indexes to maintain data integrity and support common queries.

The SQL examples use SQLite-compatible syntax.

## 2. Entities and Attributes

### 2.1 Users

The `users` table stores information about people who use QuickNotes.

| Column          | Data type | Constraints      | Description                |
| --------------- | --------- | ---------------- | -------------------------- |
| `id`            | INTEGER   | Primary key      | Unique user identifier     |
| `username`      | TEXT      | NOT NULL, UNIQUE | User's username            |
| `email`         | TEXT      | NOT NULL, UNIQUE | User's email address       |
| `password_hash` | TEXT      | NOT NULL         | Securely hashed password   |
| `created_at`    | TEXT      | NOT NULL         | Account creation timestamp |

Passwords must never be stored as plain text. The application should store an appropriate password hash produced by a secure password-hashing algorithm.

### 2.2 Notes

The `notes` table stores notes created by users.

| Column       | Data type | Constraints                | Description                               |
| ------------ | --------- | -------------------------- | ----------------------------------------- |
| `id`         | INTEGER   | Primary key                | Unique note identifier                    |
| `user_id`    | INTEGER   | NOT NULL, foreign key      | Owner of the note                         |
| `title`      | TEXT      | NOT NULL, CHECK constraint | Note title, 1–100 characters              |
| `body`       | TEXT      | NOT NULL                   | Note content                              |
| `category`   | TEXT      | NOT NULL                   | Category such as Personal, Work, or Study |
| `created_at` | TEXT      | NOT NULL                   | Creation timestamp                        |
| `updated_at` | TEXT      | NOT NULL                   | Last update timestamp                     |

The `user_id` column references `users.id`.

A note belongs to one user, while a user can own multiple notes. The category is stored directly as text in this design so that the model contains the four required tables without introducing a separate `categories` table.

### 2.3 Tags

The `tags` table stores labels that users can attach to their notes.

| Column       | Data type | Constraints           | Description            |
| ------------ | --------- | --------------------- | ---------------------- |
| `id`         | INTEGER   | Primary key           | Unique tag identifier  |
| `user_id`    | INTEGER   | NOT NULL, foreign key | Owner of the tag       |
| `name`       | TEXT      | NOT NULL              | Tag name               |
| `created_at` | TEXT      | NOT NULL              | Tag creation timestamp |

The `user_id` column references `users.id`.

Examples of tags include `urgent`, `revision`, and `ideas`.

A user can create multiple tags. The same tag name may be used by different users, but tag names must be unique for each individual user.

### 2.4 Note_Tags

The `note_tags` table is a junction table that connects notes and tags.

| Column    | Data type | Constraints                                | Description                    |
| --------- | --------- | ------------------------------------------ | ------------------------------ |
| `note_id` | INTEGER   | Part of composite primary key; foreign key | Referenced note                |
| `tag_id`  | INTEGER   | Part of composite primary key; foreign key | Referenced tag                 |
| `user_id` | INTEGER   | NOT NULL, foreign-key relationship         | Owner of both the note and tag |

The combination of `note_id` and `tag_id` forms the composite primary key.

The `user_id` column, together with composite foreign keys, ensures that a tag can only be associated with a note belonging to the same user.

## 3. Relationships

The data model uses one-to-many and many-to-many relationships.

| Relationship  | Cardinality  | Explanation                                                                                      |
| ------------- | ------------ | ------------------------------------------------------------------------------------------------ |
| Users → Notes | One-to-many  | One user can own many notes; each note belongs to one user.                                      |
| Users → Tags  | One-to-many  | One user can create many tags; each tag belongs to one user.                                     |
| Notes ↔ Tags  | Many-to-many | A note can have several tags, and a tag can be attached to several notes owned by the same user. |

### 3.1 One-to-Many Relationships

**Users and notes:** The `notes.user_id` foreign key identifies the owner of each note.

**Users and tags:** The `tags.user_id` foreign key identifies the owner of each tag.

These relationships avoid repeating complete user information in every note or tag record.

### 3.2 Many-to-Many Relationship

A note may have multiple tags, and the same tag may label multiple notes.

The `note_tags` junction table implements this relationship using foreign keys to the `notes` and `tags` tables.

The composite primary key prevents the same tag from being assigned to the same note more than once.

### 3.3 Relationship Diagram

```text
+-------------+          +-------------+
|    USERS    |          |    NOTES    |
+-------------+          +-------------+
| PK id       | 1      * | PK id       |
| username    |----------| FK user_id  |
| email       |          | title       |
+-------------+          | body        |
       |                 +------+------+
       | 1                      | 1
       |                        |
       | *                      | *
+-------------+          +------v------+
|    TAGS     |          |  NOTE_TAGS  |
+-------------+          +-------------+
| PK id       | 1      * | PK, FK note_id |
| FK user_id  |----------| PK, FK tag_id  |
| name        |          | FK user_id     |
+-------------+          +-------------+
```

The diagram illustrates the relationship structure; the SQL definitions below specify the actual foreign keys.

## 4. CREATE TABLE Statements

The following schema defines all four tables and their constraints.

Enable SQLite foreign-key enforcement on each database connection:

```sql
PRAGMA foreign_keys = ON;
```

### 4.1 Users Table

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

The primary key uniquely identifies each user. The unique constraints prevent duplicate usernames and email addresses.

### 4.2 Notes Table

```sql
CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL
        CHECK (length(trim(title)) BETWEEN 1 AND 100),
    body TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Personal',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (id, user_id),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
```

The title constraint rejects empty or whitespace-only titles and limits the title to 100 characters.

The foreign key ensures that a note cannot reference a nonexistent user. Deleting a user deletes that user's notes.

The application must update `updated_at` whenever a note changes.

### 4.3 Tags Table

```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL
        CHECK (length(trim(name)) > 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, name),
    UNIQUE (id, user_id),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
```

The unique constraint on `(user_id, name)` prevents a user from creating duplicate tag names.

The composite unique constraint on `(id, user_id)` supports the ownership checks implemented in the junction table.

### 4.4 Note_Tags Junction Table

```sql
CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,

    PRIMARY KEY (note_id, tag_id),

    FOREIGN KEY (note_id, user_id)
        REFERENCES notes(id, user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (tag_id, user_id)
        REFERENCES tags(id, user_id)
        ON DELETE CASCADE
);
```

The composite primary key prevents duplicate note-tag associations.

The composite foreign keys ensure that both the note and tag belong to the same user. Deleting the associated note or tag removes the corresponding junction records.

## 5. Example SQL Queries

The following queries demonstrate common operations using the proposed database schema.

### 5.1 Retrieve All Notes Belonging to a User

```sql
SELECT
    id,
    title,
    body,
    category,
    created_at,
    updated_at
FROM notes
WHERE user_id = ?
ORDER BY updated_at DESC;
```

The parameter represents the authenticated user's ID.

The query returns that user's notes, with the most recently updated notes appearing first.

### 5.2 Retrieve Tags Assigned to a Note

```sql
SELECT
    t.id,
    t.name
FROM tags AS t
JOIN note_tags AS nt
    ON nt.tag_id = t.id
   AND nt.user_id = t.user_id
WHERE nt.note_id = ?
  AND nt.user_id = ?
ORDER BY t.name;
```

This JOIN combines the `tags` and `note_tags` tables to retrieve the tags assigned to a specific note.

The parameters represent the note ID and the authenticated user's ID.

### 5.3 Retrieve Notes and Their Tags

```sql
SELECT
    n.id AS note_id,
    n.title AS note_title,
    t.name AS tag_name
FROM notes AS n
JOIN note_tags AS nt
    ON nt.note_id = n.id
   AND nt.user_id = n.user_id
JOIN tags AS t
    ON t.id = nt.tag_id
   AND t.user_id = nt.user_id
WHERE n.user_id = ?
ORDER BY n.updated_at DESC, t.name;
```

This query joins three tables to display each note alongside its associated tags.

A note with several tags will appear in several result rows, one for each tag.

### 5.4 Count Notes Owned by Each User

```sql
SELECT
    u.id,
    u.username,
    COUNT(n.id) AS total_notes
FROM users AS u
LEFT JOIN notes AS n
    ON n.user_id = u.id
GROUP BY u.id, u.username
ORDER BY total_notes DESC;
```

The `LEFT JOIN` includes users who have not created any notes. For these users, `total_notes` is zero.

### 5.5 Create a Note

```sql
INSERT INTO notes (
    user_id,
    title,
    body,
    category
)
VALUES (
    ?,
    ?,
    ?,
    ?
);
```

The parameters should be supplied through a parameterized database query rather than unsafe string concatenation.

The application should obtain the owner ID from the authenticated user's identity instead of trusting an unverified client-supplied owner ID.

## 6. Indexes

Indexes help the database find records without scanning every row.

### 6.1 Index Notes by User and Update Time

```sql
CREATE INDEX idx_notes_user_updated
ON notes(user_id, updated_at DESC);
```

**Reason:** Retrieving a user's notes sorted by their most recent update is a common operation. This index can help the database filter by user and retrieve notes in the required order.

### 6.2 Index the Tag Side of the Junction Table

```sql
CREATE INDEX idx_note_tags_tag_id
ON note_tags(tag_id);
```

**Reason:** The composite primary key `(note_id, tag_id)` is particularly useful when looking up tags for a note. This additional index helps queries that start with a tag and need to find the associated notes.

Indexes consume storage and increase the work required for inserts and updates, so their usefulness should be reviewed against actual query patterns.

## 7. SQL vs. NoSQL

A relational SQL database is suitable for QuickNotes because the application contains structured entities with clear relationships. Users own notes and tags, while notes and tags have a many-to-many relationship.

SQL databases support foreign keys, primary keys, constraints, transactions, and JOIN queries. These features help maintain data integrity and make it easier to retrieve related information.

A NoSQL database may be useful for certain large-scale or flexible-data workloads, but it could require more application-level work to maintain these relationships and constraints.

For this design, SQLite is suitable for demonstrating the schema and queries locally. PostgreSQL is a possible production choice if the application requires concurrent access, managed database services, replication, or higher availability.

## 8. Conclusion

The QuickNotes data model contains four tables: `users`, `notes`, `tags`, and `note_tags`.

The design demonstrates one-to-many relationships between users and their notes, and users and their tags. It also implements a many-to-many relationship between notes and tags through a junction table.

Primary keys, foreign keys, unique constraints, title validation, parameterized queries, and indexes support data integrity and common application operations.

The schema is a proposed design. It should be tested against the actual application requirements before production use.
