# QuickNotes API Design

## 1. Overview

QuickNotes is a note-taking application that allows users to create, retrieve, search, update, and delete notes. This document defines the proposed REST API, including its endpoints, request and response formats, success status codes, and error handling.

The API uses HTTP methods to represent operations on resources and JSON to exchange data between the client and server.

**Base URL:** `/api`

**Data format:** `application/json`

**Authentication:** Production endpoints that access private user data require authentication.

**Important:** This document describes the proposed QuickNotes API. The browser-based API client in this repository uses JSONPlaceholder as a demonstration service; JSONPlaceholder does not implement this complete QuickNotes API.

## 2. REST Endpoints

The following table describes the proposed endpoints.

| Method | Path                               | Description                                                                   | Success status   |
| ------ | ---------------------------------- | ----------------------------------------------------------------------------- | ---------------- |
| GET    | `/api/notes`                       | Retrieve the authenticated user's notes, with optional search and pagination. | `200 OK`         |
| GET    | `/api/notes/{id}`                  | Retrieve a specific note owned by the authenticated user.                     | `200 OK`         |
| POST   | `/api/notes`                       | Create a new note.                                                            | `201 Created`    |
| PUT    | `/api/notes/{id}`                  | Replace the editable fields of an existing note.                              | `200 OK`         |
| PATCH  | `/api/notes/{id}`                  | Update selected fields of an existing note.                                   | `200 OK`         |
| DELETE | `/api/notes/{id}`                  | Delete a note owned by the authenticated user.                                | `204 No Content` |
| GET    | `/api/notes/{id}/tags`             | Retrieve the tags assigned to a specific note.                                | `200 OK`         |
| PUT    | `/api/notes/{noteId}/tags/{tagId}` | Assign an existing tag to a note.                                             | `204 No Content` |
| DELETE | `/api/notes/{noteId}/tags/{tagId}` | Remove a tag assignment from a note.                                          | `204 No Content` |

The `{id}`, `{noteId}`, and `{tagId}` values are path parameters representing resource identifiers.

The API must verify ownership and authorization before returning or modifying private resources.

### 2.1 GET /api/notes

Retrieves the authenticated user's notes.

Optional query parameters include:

* `q` — searches relevant note text.
* `page` — selects the page number.
* `limit` — limits the number of notes returned per page.

Example request:

```http
GET /api/notes?q=study&page=1&limit=10
Authorization: Bearer <access-token>
Accept: application/json
```

Success status: `200 OK`.

### 2.2 GET /api/notes/{id}

Retrieves one note by its identifier.

Example request:

```http
GET /api/notes/101
Authorization: Bearer <access-token>
Accept: application/json
```

Success status: `200 OK`.

If the note does not exist or is not available to the requesting user, the API should return an appropriate error without exposing another user's private information.

### 2.3 POST /api/notes

Creates a new note.

Example request:

```http
POST /api/notes
Authorization: Bearer <access-token>
Content-Type: application/json
Accept: application/json
```

Request body:

```json
{
  "title": "Study plan",
  "body": "Review the system design notes.",
  "category": "Study"
}
```

The backend must validate the title, enforce the 100-character maximum, and determine the owner from the authenticated user rather than trusting a client-supplied owner ID.

Success status: `201 Created`.

### 2.4 PUT /api/notes/{id}

Replaces the editable fields of an existing note.

Example request:

```http
PUT /api/notes/101
Authorization: Bearer <access-token>
Content-Type: application/json
```

Request body:

```json
{
  "title": "Updated study plan",
  "body": "Review the API and database documentation.",
  "category": "Study"
}
```

Success status: `200 OK`.

The endpoint should validate the request and verify the user's permission to modify the note.

### 2.5 PATCH /api/notes/{id}

Updates only the specified fields of an existing note.

Example request:

```http
PATCH /api/notes/101
Authorization: Bearer <access-token>
Content-Type: application/json
```

Request body:

```json
{
  "title": "Revised study plan"
}
```

Success status: `200 OK`.

Fields not included in the request remain unchanged. The backend must reject invalid fields and validate any supplied values.

### 2.6 DELETE /api/notes/{id}

Deletes an existing note.

Example request:

```http
DELETE /api/notes/101
Authorization: Bearer <access-token>
```

Success status: `204 No Content`.

A successful deletion returns no response body.

### 2.7 GET /api/notes/{id}/tags

Retrieves the tags associated with a note.

Example request:

```http
GET /api/notes/101/tags
Authorization: Bearer <access-token>
Accept: application/json
```

Example response:

```json
{
  "data": [
    {
      "id": 5,
      "name": "revision"
    },
    {
      "id": 8,
      "name": "urgent"
    }
  ]
}
```

Success status: `200 OK`.

The backend must check that the requesting user is authorized to access the note and its tags.

### 2.8 PUT /api/notes/{noteId}/tags/{tagId}

Assigns an existing tag to a note.

Example request:

```http
PUT /api/notes/101/tags/5
Authorization: Bearer <access-token>
```

Success status: `204 No Content`.

The backend must verify that the note and tag belong to the same user. The operation should avoid creating duplicate note-tag associations.

### 2.9 DELETE /api/notes/{noteId}/tags/{tagId}

Removes a tag assignment without deleting the note or the tag itself.

Example request:

```http
DELETE /api/notes/101/tags/5
Authorization: Bearer <access-token>
```

Success status: `204 No Content`.

The backend removes the corresponding association from the `note_tags` table.

## 3. Request and Response Examples

### 3.1 Create a Note

**Request**

```http
POST /api/notes
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "title": "Assignment",
  "body": "Complete the QuickNotes API design.",
  "category": "Study"
}
```

**Successful response**

HTTP status: `201 Created`

```json
{
  "id": 101,
  "title": "Assignment",
  "body": "Complete the QuickNotes API design.",
  "category": "Study",
  "created_at": "2026-10-26T09:00:00Z",
  "updated_at": "2026-10-26T09:00:00Z"
}
```

The server generates the note identifier and timestamps. The owner is derived from the authenticated user's identity.

### 3.2 List Notes

**Request**

```http
GET /api/notes?page=1&limit=10
Authorization: Bearer <access-token>
Accept: application/json
```

**Successful response**

HTTP status: `200 OK`

```json
{
  "data": [
    {
      "id": 101,
      "title": "Assignment",
      "body": "Complete the QuickNotes API design.",
      "category": "Study",
      "created_at": "2026-10-26T09:00:00Z",
      "updated_at": "2026-10-26T09:00:00Z"
    },
    {
      "id": 102,
      "title": "Meeting",
      "body": "Prepare the project presentation.",
      "category": "Work",
      "created_at": "2026-10-25T10:00:00Z",
      "updated_at": "2026-10-25T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2
  }
}
```

The `data` property contains the notes returned for the requested page. The `pagination` object describes the current page, page size, and total number of matching notes.

When no notes match the request, the API can return `200 OK` with an empty `data` array.

## 4. Error Status Codes

The API returns suitable HTTP error status codes when a request cannot be completed.

| Status code | Name                  | Meaning                                                                   | Example situation                                              |
| ----------- | --------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `400`       | Bad Request           | The request is malformed or contains invalid data.                        | The title is empty or exceeds 100 characters.                  |
| `401`       | Unauthorized          | Authentication is missing or invalid.                                     | The access token is missing or expired.                        |
| `403`       | Forbidden             | The authenticated user is not allowed to perform the requested operation. | A user attempts an operation on a resource they cannot access. |
| `404`       | Not Found             | The requested resource does not exist or is not available to the user.    | A note identifier does not match an accessible note.           |
| `409`       | Conflict              | The request conflicts with an existing resource or state.                 | A tag name conflicts with a uniqueness constraint.             |
| `500`       | Internal Server Error | An unexpected server-side error occurred.                                 | An unhandled application or database failure occurs.           |

The backend must avoid returning internal stack traces, database credentials, or other sensitive implementation details to clients.

### 4.1 Example Error Response

Example: the client submits a note with a title that exceeds the allowed maximum.

HTTP status: `400 Bad Request`

```json
{
  "error": {
    "code": "INVALID_TITLE",
    "message": "The title must contain between 1 and 100 characters."
  }
}
```

The response uses a consistent structure so the frontend can identify the error and display a useful message.

### 4.2 Other Example Errors

**Missing or invalid authentication — `401 Unauthorized`**

```json
{
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication is required."
  }
}
```

**Insufficient permission — `403 Forbidden`**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not allowed to perform this operation."
  }
}
```

**Resource not found — `404 Not Found`**

```json
{
  "error": {
    "code": "NOTE_NOT_FOUND",
    "message": "The requested note was not found."
  }
}
```

**Unexpected server error — `500 Internal Server Error`**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

These error codes and messages describe the proposed API contract. The implementation should return errors that match the actual failure and must not expose private information.

## 5. Validation Rules

The backend should enforce the following rules:

1. The note title is required.
2. The title must not exceed 100 characters.
3. Input values must have the expected data types.
4. Required fields must not be silently accepted when absent.
5. Resource identifiers must be valid.
6. Users must be authenticated before accessing private notes.
7. Users must only modify notes and tags they are authorized to access.
8. Database operations must use parameterized queries.
9. Unexpected errors must not disclose internal implementation details.
10. Pagination parameters must be validated and restricted to reasonable values.

Frontend validation improves usability but does not replace backend validation.

## 6. HTTP Method and Status Code Summary

| Operation                 | Expected status             | Explanation                                            |
| ------------------------- | --------------------------- | ------------------------------------------------------ |
| Retrieve notes            | `200 OK`                    | The notes were retrieved successfully.                 |
| Retrieve one note         | `200 OK`                    | The requested note was retrieved successfully.         |
| Create a note             | `201 Created`               | A new note was created successfully.                   |
| Replace a note            | `200 OK`                    | The note was updated successfully.                     |
| Partially update a note   | `200 OK`                    | The selected fields were updated successfully.         |
| Delete a note             | `204 No Content`            | The note was deleted successfully.                     |
| Invalid request           | `400 Bad Request`           | The request failed validation.                         |
| Missing authentication    | `401 Unauthorized`          | Valid authentication is required.                      |
| Insufficient permission   | `403 Forbidden`             | The action is not permitted.                           |
| Missing resource          | `404 Not Found`             | The resource could not be found or accessed.           |
| Conflicting operation     | `409 Conflict`              | The request conflicts with the current resource state. |
| Unexpected server failure | `500 Internal Server Error` | The server could not complete the operation.           |

## 7. Conclusion

The QuickNotes API uses REST-style endpoints and JSON messages to provide consistent note management operations.

The design defines endpoints for retrieving, creating, updating, deleting, and tagging notes. It also specifies validation rules, success responses, error status codes, and example request and response bodies.

Authentication, authorization, server-side validation, and parameterized database queries are essential for protecting users' private notes. The proposed API contract should be kept consistent with the backend implementation as the project develops.
