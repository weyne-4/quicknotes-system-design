# QuickNotes Data Model

## 1. Overview

QuickNotes is a note-taking application that allows users to create, retrieve, update, delete, categorize, and organize their notes.

This document defines the proposed relational data model for the QuickNotes backend.

The database contains four main entities:

1. Users
2. Notes
3. Categories
4. Tags

The design uses primary keys, foreign keys, constraints, and indexes to maintain data integrity and support common queries.

## 2. Entities and Attributes

### 2.1 Users

Stores information about people who use QuickNotes.

| Attribute  | Data type | Constraints      | Description                |
| ---------- | --------- | ---------------- | -------------------------- |
| id         | INTEGER   | Primary key      | Unique user identifier     |
| username   | TEXT      | NOT NULL, UNIQUE | User's username            |
| email      | TEXT      | NOT NULL, UNIQUE | User's email address       |
| created_at | TEXT      | NOT NULL         | Account creation timestamp |

### 2.2 Notes

Stores notes created by users.

| Attribute   | Data type | Constraints           | Description                        |
| ----------- | --------- | --------------------- | ---------------------------------- |
| id          | INTEGER   | Primary key           | Unique note identifier             |
| user_id     | INTEGER   | Foreign key, NOT NULL | Owner of the note                  |
| category_id | INTEGER   | Foreign key, nullable | Note's category                    |
| title       | TEXT      | NOT NULL              | Note title, maximum 100 characters |
| body        | TEXT      | Nullable              | Note content                       |
| created_at  | TEXT      | NOT NULL              | Creation timestamp                 |
| updated_at  | TEXT      | NOT NULL              | Last update timestamp              |

A note belongs to one user and may belong to one category. A user can own multiple notes.

### 2.3 Categories

Stores categories used to organize notes.

| Attribute  | Data type | Constraints           | Description                |
| ---------- | --------- | --------------------- | -------------------------- |
| id         | INTEGER   | Primary key           | Unique category identifier |
| user_id    | INTEGER   | Foreign key, NOT NULL | Owner of the category      |
| name       | TEXT      | NOT NULL              | Category name              |
| created_at | TEXT      | NOT NULL              | Creation timestamp         |

Examples include Personal, Work, and Study.

A category belongs to one user and can contain multiple notes.

Category names must be unique for each user.

### 2.4 Tags

Stores optional labels that can be attached to notes.

| Attribute  | Data type | Constraints           | Description           |
| ---------- | --------- | --------------------- | --------------------- |
| id         | INTEGER   | Primary key           | Unique tag identifier |
| user_id    | INTEGER   | Foreign key, NOT NULL | Owner of the tag      |
| name       | TEXT      | NOT NULL              | Tag name              |
| created_at | TEXT      | NOT NULL              | Creation timestamp    |

Examples include urgent, revision, and ideas.

A tag belongs to one user. A note may have multiple tags, and a tag may be attached to multiple notes.

The many-to-many relationship between notes and tags is implemented through a junction table called `note_tags`.

The junction table supports this relationship without duplicating note or tag information.

## 3. Relationships

The database uses the following relationships:

| Relationship       | Cardinality  | Explanation                                                       |
| ------------------ | ------------ | ----------------------------------------------------------------- |
| Users → Notes      | One-to-many  | One user can own many notes                                       |
| Users → Categories | One-to-many  | One user can create many categories                               |
| Users → Tags       | One-to-many  | One user can create many tags                                     |
| Categories → Notes | One-to-many  | One category can contain many notes                               |
| Notes ↔ Tags       | Many-to-many | A note can have multiple tags, and a tag can label multiple notes |

### Relationship diagram

```text
USERS
  |
  | 1
  |------< NOTES >------ 1 CATEGORIES
  |          |
  |          | 1
  |          |
  |          v
  |       NOTE_TAGS
  |          ^
  |          | many-to-one
  |          |
  |         TAGS
```

More precisely, `note_tags` connects notes and tags using their IDs.

## 4. CREATE TABLE Statements

The following schema uses SQLite-compatible SQL.

### 4.1 Users

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Categories

```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, name),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
```

### 4.3 Notes

```sql
CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    title TEXT NOT NULL
        CHECK (length(trim(title)) BETWEEN 1 AND 100),
    body TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
);
```

The title constraint rejects empty or whitespace-only titles and limits titles to 100 characters.

The backend should also verify that a selected category belongs to the note's user.

### 4.4 Tags

```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, name),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
```

### 4.5 Note-tags junction table

The four main entities are Users, Notes, Categories, and Tags. The following junction table implements the many-to-many relationship between Notes and Tags.

```sql
CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,

    PRIMARY KEY (note_id, tag_id),

    FOREIGN KEY (note_id)
        REFERENCES notes(id)
        ON DELETE CASCADE,

    FOREIGN KEY (tag_id)
        REFERENCES tags(id)
        ON DELETE CASCADE
);
```

The composite primary key prevents the same tag from being assigned to the same note more than once.

## 5. Example SQL Queries

### 5.1 Retrieve all notes belonging to a user

```sql
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = 1
ORDER BY updated_at DESC;
```

This retrieves a user's notes, showing the most recently updated notes first.

### 5.2 Retrieve a specific note

```sql
SELECT id, title, body, category_id, created_at, updated_at
FROM notes
WHERE id = 1
  AND user_id = 1;
```

Checking both the note ID and user ID helps prevent users from accessing another user's note through this query.

### 5.3 Create a note

```sql
INSERT INTO notes (user_id, category_id, title, body)
VALUES (1, 1, 'Study JavaScript', 'Review asynchronous requests.');
```

The database generates the note ID and creation timestamps.

The application should verify that category `1` belongs to user `1` before inserting the note.

### 5.4 Update a note

```sql
UPDATE notes
SET title = 'Complete API assignment',
    body = 'Finish testing GET, POST, and DELETE.',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1
  AND user_id = 1;
```

The application should check the affected-row count to determine whether the note was updated.

### 5.5 Delete a note

```sql
DELETE FROM notes
WHERE id = 1
  AND user_id = 1;
```

The note is deleted only when the ID and owner match. Associated rows in `note_tags` are automatically removed.

### 5.6 Count notes by category

```sql
SELECT
    categories.name,
    COUNT(notes.id) AS note_count
FROM categories
LEFT JOIN notes
    ON notes.category_id = categories.id
   AND notes.user_id = categories.user_id
WHERE categories.user_id = 1
GROUP BY categories.id, categories.name
ORDER BY categories.name;
```

This shows each category and the number of notes it contains, including categories with no notes.

### 5.7 Find notes by tag

```sql
SELECT DISTINCT notes.id, notes.title, notes.body
FROM notes
JOIN note_tags
    ON note_tags.note_id = notes.id
JOIN tags
    ON tags.id = note_tags.tag_id
WHERE notes.user_id = 1
  AND tags.user_id = 1
  AND tags.name = 'revision'
ORDER BY notes.updated_at DESC;
```

This retrieves the user's notes associated with the `revision` tag.

### 5.8 Retrieve notes with their category

```sql
SELECT
    notes.id,
    notes.title,
    notes.body,
    categories.name AS category
FROM notes
LEFT JOIN categories
    ON categories.id = notes.category_id
   AND categories.user_id = notes.user_id
WHERE notes.user_id = 1
ORDER BY notes.created_at DESC;
```

The `LEFT JOIN` allows notes without a category to appear in the results.

## 6. Indexes

Indexes can improve query performance by reducing the amount of data the database must scan.

The following indexes support common QuickNotes operations.

### 6.1 Index notes by user and update time

sql
CREATE INDEX idx_notes_user_updated
ON notes(user_id, updated_at);


Supports retrieving a user's notes in update-time order.

### 6.2 Index notes by category

sql
CREATE INDEX idx_notes_category
ON notes(category_id);


Supports queries that retrieve notes belonging to a category.

### 6.3 Index tags by user and name

sql
CREATE INDEX idx_tags_user_name
ON tags(user_id, name);


Helps locate a user's tags by name.

### 6.4 Index the note-tags relationship by tag

sql
CREATE INDEX idx_note_tags_tag
ON note_tags(tag_id);


The composite primary key on `(note_id, tag_id)` already supports lookups starting with `note_id`. This additional index supports lookups starting with `tag_id`.

The unique constraints on `users.username`, `users.email`, `(categories.user_id, categories.name)`, and `(tags.user_id, tags.name)` also create supporting indexes in SQLite.

Indexes should be added based on actual query patterns and measured performance rather than added indiscriminately.

## 7. SQL vs. NoSQL Decision

### Decision: Use a relational SQL database

SQLite is a suitable starting point for a small QuickNotes project. PostgreSQL would also be a suitable choice for a deployed application requiring multiple concurrent users and a managed server database.

### Reasons for choosing SQL

**1. Relationships**

QuickNotes contains clear relationships between users, notes, categories, and tags. Relational tables and foreign keys express these relationships directly.

**2. Data integrity**

Primary keys, foreign keys, unique constraints, and checks help prevent invalid or inconsistent records.

**3. Transactions**

SQL databases support transactions that allow related operations to succeed or fail together.

For example, creating a note and assigning several tags can be performed within a transaction.

**4. Querying**

SQL supports joins, filtering, sorting, grouping, and aggregation. These features are useful for retrieving notes by user, category, or tag.

**5. Reduced duplication**

Separate tables for users, categories, notes, and tags avoid repeatedly storing the same information.

### Why not NoSQL?

A document-oriented NoSQL database could store notes and their metadata as nested documents. It may be appropriate for applications with highly variable document structures or particular horizontal-scaling requirements.

However, QuickNotes has a relatively structured data model with explicit relationships and consistency requirements. A relational database is a straightforward fit.

NoSQL is not inherently unsuitable; SQL is simply the preferred choice for this application's current requirements.

## 8. Data Integrity and Security

The backend should:

* Validate note titles before inserting or updating them.
* Use parameterized SQL queries to prevent SQL injection.
* Authenticate users before accessing private notes.
* Check note ownership on every read, update, and delete operation.
* Verify category and tag ownership before associating them with notes.
* Enable SQLite foreign-key enforcement when using SQLite.
* Use transactions when multiple related records must be changed together.
* Avoid exposing sensitive database information in API responses.

## 9. Conclusion

The proposed QuickNotes data model uses four main entities: Users, Notes, Categories, and Tags.

A relational SQL database provides the relationships, integrity constraints, transactions, and querying capabilities needed for the application's core features.

The `note_tags` junction table implements the many-to-many relationship between notes and tags without introducing a fifth main entity.
