# QuickNotes API Design

## 1. Overview

The QuickNotes API will allow users to create, retrieve, update, and delete notes.

This document describes the proposed REST API that the QuickNotes backend team should implement.

Unlike JSONPlaceholder, which is used for frontend testing, the real QuickNotes backend should persist notes in a database.

## 2. Base URL

text
/api/notes

The deployed backend will provide the complete base URL. For example, the API could be hosted at:

text
https://your-domain.example/api/notes

The example domain is a placeholder, not a deployed service.

## 3. Note Data Structure

Each note contains:

| Field       | Type    | Description                                 |
| ----------- | ------- | ------------------------------------------- |
| `id`        | Integer | Unique identifier assigned by the server    |
| `title`     | String  | Required note title, maximum 100 characters |
| `body`      | String  | Optional note content                       |
| `userId`    | Integer | Identifier of the note's owner              |
| `createdAt` | String  | Date and time the note was created          |
| `updatedAt` | String  | Date and time the note was last updated     |

The server generates the note ID and timestamps.

## 4. Endpoint Table

| Method | Endpoint          | Description              | Success status |
| ------ | ----------------- | ------------------------ | -------------- |
| GET    | `/api/notes`      | Retrieve notes           | 200 OK         |
| GET    | `/api/notes/{id}` | Retrieve one note by ID  | 200 OK         |
| POST   | `/api/notes`      | Create a note            | 201 Created    |
| PUT    | `/api/notes/{id}` | Replace an existing note | 200 OK         |
| DELETE | `/api/notes/{id}` | Delete a note            | 204 No Content |

## 5. Request and Response Examples

### 5.1 Retrieve All Notes

**Request**

http
GET /api/notes
Accept: application/json

**Successful response — 200 OK**

json
[
{
"id": 1,
"title": "Complete assignment",
"body": "Finish the API client exercise.",
"userId": 1,
"createdAt": "2026-10-24T10:00:00Z",
"updatedAt": "2026-10-24T10:00:00Z"
},
{
"id": 2,
"title": "Study JavaScript",
"body": "Review async and await.",
"userId": 1,
"createdAt": "2026-10-24T11:00:00Z",
"updatedAt": "2026-10-24T11:00:00Z"
}
]

If no notes exist, the API returns `200 OK` with an empty array:

json
[]

### 5.2 Retrieve One Note

**Request**

http
GET /api/notes/1
Accept: application/json

**Successful response — 200 OK**

json
{
"id": 1,
"title": "Complete assignment",
"body": "Finish the API client exercise.",
"userId": 1,
"createdAt": "2026-10-24T10:00:00Z",
"updatedAt": "2026-10-24T10:00:00Z"
}

### 5.3 Create a Note

**Request**

http
POST /api/notes
Content-Type: application/json

Request body:

json
{
"title": "Learn API development",
"body": "Practise GET, POST, and DELETE.",
"userId": 1
}

The title is required and must not exceed 100 characters. The body is optional.

**Successful response — 201 Created**

json
{
"id": 101,
"title": "Learn API development",
"body": "Practise GET, POST, and DELETE.",
"userId": 1,
"createdAt": "2026-10-24T12:00:00Z",
"updatedAt": "2026-10-24T12:00:00Z"
}

The server assigns the new ID and timestamps and stores the note in the database.

### 5.4 Update a Note

**Request**

http
PUT /api/notes/1
Content-Type: application/json

Request body:

```json
{
  "title": "Complete API assignment",
  "body": "Finish and test all API operations.",
  "userId": 1
}


**Successful response — 200 OK**

..json
{
  "id": 1,
  "title": "Complete API assignment",
  "body": "Finish and test all API operations.",
  "userId": 1,
  "createdAt": "2026-10-24T10:00:00Z",
  "updatedAt": "2026-10-24T13:00:00Z"
}


The server updates the existing note and its `updatedAt` timestamp.

### 5.5 Delete a Note

**Request**

http
DELETE /api/notes/1


**Successful response — 204 No Content**

The server deletes the note from the database and returns an empty response body.

### 5.6 Retrieve Notes for a User

**Request**

http
GET /api/notes?userId=1
Accept: application/json


**Successful response — 200 OK**

json
[
  {
    "id": 2,
    "title": "Study JavaScript",
    "body": "Review async and await.",
    "userId": 1,
    "createdAt": "2026-10-24T11:00:00Z",
    "updatedAt": "2026-10-24T11:00:00Z"
  }
]


The API returns notes belonging to the specified user. An empty array is returned when the user has no notes.

## 6. Error Handling

The API should return an appropriate HTTP status code and a JSON error response when a request fails.

### 6.1 Error Response Format

json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The title is required."
  }
}


### 6.2 HTTP Error Codes

| Status code               | Meaning                                               | Example                                              |
| ------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| 400 Bad Request           | The request contains invalid data                     | Missing title or title longer than 100 characters    |
| 401 Unauthorized          | Authentication is required or invalid                 | Missing or invalid authentication credentials        |
| 403 Forbidden             | The user is not permitted to perform the operation    | Attempting to delete another user's note             |
| 404 Not Found             | The requested note does not exist                     | Requesting `/api/notes/9999`                         |
| 409 Conflict              | The request conflicts with the current resource state | A conflicting operation, if supported by the backend |
| 500 Internal Server Error | An unexpected server-side failure occurred            | An unhandled application error                       |

The backend should return clear error messages without exposing database credentials, stack traces, or other sensitive implementation details.

## 7. Validation Rules

The backend must validate incoming data even if the frontend also validates it.

* The title is required.
* The title must be a string containing between 1 and 100 characters after trimming whitespace.
* The body is optional and must be a string when provided.
* The `userId` must identify a valid user.
* The note ID must be valid for operations on an existing note.
* A request to update or delete a nonexistent note must return `404 Not Found`.

## 8. Data Persistence

Unlike JSONPlaceholder, the real QuickNotes backend must persist created notes in a database.

* Creating a note stores it and assigns a unique ID.
* Retrieving notes reads the saved records.
* Updating a note changes the stored record.
* Deleting a note removes the stored record.
* Changes must remain available after the application or server restarts.

## 9. Frontend Integration

The frontend should communicate with the real backend through HTTP requests.

It should:

* Show a loading message while requests are running.
* Display success messages after successful operations.
* Display friendly errors when requests fail.
* Disable relevant buttons while requests are in progress.
* Use `textContent` when inserting note text into the page.
* Validate the title before submitting a create request.
* Update the displayed notes after successful create, update, and delete operations.

## 10. Scope

This document defines the proposed API contract. It does not implement the backend, database, authentication, or deployment.

The frontend and backend teams should agree on the contract before implementing the production API.
