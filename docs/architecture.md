# QuickNotes System Architecture

## 1. Overview

QuickNotes is a web application that allows users to create, view, search, update, and delete notes. This document describes the proposed system architecture, functional and non-functional requirements, capacity estimates, component responsibilities, request flows, architectural trade-offs, and potential single points of failure.

The architecture is a proposed design for the application. Deployment details and performance figures are estimates rather than measured production results.

## 2. Requirements

### 2.1 Functional Requirements

The system must allow users to:

1. Create a note with a title, body, and category.
2. View their saved notes.
3. Search notes by text.
4. Update an existing note.
5. Delete a note.
6. Organize notes into categories.
7. Receive clear feedback when an operation succeeds or fails.

If authentication is implemented, users must only be able to access notes they are authorized to view or modify.

### 2.2 Non-Functional Requirements

* **Usability:** The interface should be simple and responsive on desktop and mobile devices.
* **Performance:** Common operations should return results quickly under normal load.
* **Reliability:** The application should handle temporary errors without losing previously saved data.
* **Security:** Inputs must be validated, database queries must be protected against injection, and access controls must be enforced.
* **Maintainability:** The frontend, backend, and data-storage responsibilities should be separated.
* **Data integrity:** Notes should be stored persistently and changes should be handled consistently.
* **Scalability:** The architecture should support additional users and features as demand grows.

## 3. High-Level Architecture

The proposed architecture uses a web frontend, a backend API, and a relational database.

```text
                  +----------------------+
                  |        User          |
                  +----------+-----------+
                             |
                             v
                  +----------------------+
                  |   Web Browser        |
                  | HTML, CSS, JavaScript|
                  +----------+-----------+
                             |
                      HTTPS / REST
                             |
                             v
                  +----------------------+
                  |   Backend API        |
                  | Validation           |
                  | Business Logic       |
                  | Authentication       |
                  | Authorization        |
                  +----------+-----------+
                             |
                         SQL Queries
                             |
                             v
                  +----------------------+
                  | Relational Database  |
                  | Users                |
                  | Notes                |
                  | Categories           |
                  | Tags                 |
                  +----------------------+
```

### Architecture Flow

1. The user interacts with the web interface.
2. The frontend sends an HTTP request to the backend API.
3. The backend validates the request and checks authorization where applicable.
4. The backend executes the required business logic.
5. The backend reads or modifies data in the relational database.
6. The backend returns an HTTP response.
7. The frontend updates the interface based on the result.

The frontend must not connect directly to the production database. Database credentials and privileged operations must remain on the backend.

## 4. Component Explanations

### 4.1 Web Frontend

**Responsibilities:**

* Display the user interface.
* Collect note titles, bodies, and categories.
* Send requests to the backend API.
* Display saved notes and search results.
* Show loading indicators, validation messages, and errors.

**Suggested technologies:** HTML, CSS, and JavaScript.

The frontend should provide immediate feedback where appropriate, but the backend remains responsible for enforcing validation and authorization.

### 4.2 Backend API

**Responsibilities:**

* Expose endpoints for note operations.
* Validate incoming data.
* Authenticate users if accounts are supported.
* Enforce authorization before accessing user-specific notes.
* Apply business rules.
* Communicate with the database.
* Return appropriate HTTP status codes and JSON responses.

**Suggested technology:** A backend framework such as FastAPI or Express.js.

Keeping business logic in the backend makes it easier to maintain consistent rules across different clients.

### 4.3 Relational Database

**Responsibilities:**

* Store users, notes, categories, and tags.
* Maintain relationships between records.
* Enforce primary-key and foreign-key constraints.
* Support searching and retrieving notes.
* Preserve data between application sessions.

**Suggested technology:** SQLite for a small local deployment or PostgreSQL for a multi-user deployment.

Database selection should depend on expected concurrency, deployment requirements, and operational needs.

### 4.4 API Communication

The frontend and backend communicate through REST-style HTTP endpoints using JSON.

Proposed endpoints include:

| Method | Endpoint          | Purpose           |
| ------ | ----------------- | ----------------- |
| GET    | `/api/notes`      | Retrieve notes    |
| GET    | `/api/notes/{id}` | Retrieve one note |
| POST   | `/api/notes`      | Create a note     |
| PUT    | `/api/notes/{id}` | Update a note     |
| DELETE | `/api/notes/{id}` | Delete a note     |

These endpoints describe the proposed production API. They do not imply that the backend has already been implemented.

## 5. Capacity Estimates

The following figures are illustrative planning assumptions for a small notes application. They are not measured traffic or performance data.

### 5.1 Initial Assumptions

| Metric                                   | Assumption |
| ---------------------------------------- | ---------: |
| Registered users                         |      1,000 |
| Daily active users                       |        200 |
| Notes per active user                    |         50 |
| Average note text size                   |       2 KB |
| Average requests per active user per day |         20 |

### 5.2 Estimated Number of Notes

Assuming each of the 1,000 registered users stores 50 notes:

Total notes = 1,000 × 50

**Estimated total: 50,000 notes**

### 5.3 Estimated Note Storage

Assuming each note requires approximately 2 KB for its text fields:

50,000 × 2 KB = 100,000 KB

This is approximately **100 MB using decimal units**.

This estimate excludes database indexes, row metadata, user records, tags, backups, logs, and database overhead. Actual storage requirements will be higher.

### 5.4 Estimated Daily Requests

Assuming 200 daily active users each make 20 requests:

200 × 20 = 4,000 requests per day.

If requests were distributed evenly across 24 hours:

4,000 ÷ 86,400 ≈ 0.046 requests per second.

Real traffic will not be evenly distributed. Peak traffic could be considerably higher, so load testing would be necessary before making capacity commitments.

### 5.5 Scaling Strategy

For the initial version, a single backend service and a relational database should be sufficient for the assumed workload, subject to testing.

If demand grows, possible improvements include:

* Adding database indexes for frequently searched fields.
* Optimizing SQL queries and pagination.
* Increasing backend resources.
* Running multiple backend instances behind a load balancer.
* Introducing caching for suitable read-heavy operations.
* Adding database replication and tested backup procedures.

Scaling should be guided by monitoring and measured bottlenecks rather than assumptions alone.

## 6. Request Flows

### 6.1 Creating a Note

1. The user enters a title, body, and category.
2. The frontend validates required fields for immediate feedback.
3. The frontend sends a `POST /api/notes` request containing JSON.
4. The backend validates the request again.
5. The backend authenticates the user and checks authorization when accounts are supported.
6. The backend inserts the note into the database.
7. The backend returns the created note and an appropriate response, normally HTTP `201 Created`.
8. The frontend displays the new note.

If validation fails, the backend should return an appropriate client-error response without saving invalid data.

### 6.2 Retrieving Notes

1. The user opens the notes page or requests a refresh.
2. The frontend sends `GET /api/notes`.
3. The backend determines which notes the user is permitted to access.
4. The backend queries the database.
5. The backend returns a JSON collection.
6. The frontend renders the notes.

For large collections, the API should support pagination to avoid returning every note in a single response.

### 6.3 Searching Notes

1. The user enters a search term.
2. The frontend sends the term to the backend, for example through `GET /api/notes?q=meeting`.
3. The backend validates the query and applies the user's access restrictions.
4. The database searches the relevant fields.
5. The backend returns matching notes.
6. The frontend displays the results or a message indicating that no matches were found.

The backend should use parameterized queries rather than building SQL statements through unsafe string concatenation.

### 6.4 Updating a Note

1. The user edits an existing note.
2. The frontend sends a `PUT /api/notes/{id}` request with the updated fields.
3. The backend validates the data and checks authorization.
4. The database updates the relevant record.
5. The backend returns the updated note.
6. The frontend displays the updated information.

If the note does not exist, the API should return an appropriate response, such as HTTP `404 Not Found`.

### 6.5 Deleting a Note

1. The user chooses to delete a note.
2. The frontend may ask the user to confirm the action.
3. The frontend sends `DELETE /api/notes/{id}`.
4. The backend checks authorization and confirms that the operation is valid.
5. The database deletes the note or marks it as deleted if a soft-delete design is chosen.
6. The backend returns a successful response, commonly HTTP `204 No Content`.
7. The frontend removes the note from the displayed list.

The frontend should only treat the deletion as successful after receiving a successful response.

## 7. Architectural Trade-Offs

### 7.1 Monolithic Backend vs. Microservices

**Initial choice: Monolithic backend**

Advantages:

* Easier to develop and understand.
* Lower deployment and infrastructure complexity.
* Simpler local testing and debugging.
* Suitable for a small application.

Disadvantages:

* Components cannot be deployed independently.
* A failure in the backend may affect all API operations.
* The application may require more careful modularization as it grows.

Microservices may become useful if the application develops substantially different workloads or independent scaling requirements. They would add network communication, deployment, monitoring, and data-consistency complexity.

### 7.2 Relational Database vs. NoSQL

**Initial choice: Relational database**

Advantages:

* Supports structured data and relationships.
* Provides transactions and integrity constraints.
* Supports queries across notes, users, and categories.
* Fits the application's expected data model.

Disadvantages:

* Schema changes may require migrations.
* Scaling some workloads horizontally can require additional planning.

A NoSQL database could be considered if future requirements demand a different data model or access pattern. It is not automatically better for a notes application.

### 7.3 Single Backend Instance vs. Multiple Instances

**Initial choice: One backend instance for the initial deployment**

Advantages:

* Simple deployment.
* Low initial infrastructure cost.
* Easier debugging.

Disadvantages:

* The backend is a potential single point of failure.
* Maintenance or a process crash can make the API unavailable.
* Capacity is limited to the resources of that instance.

For higher availability, multiple instances can run behind a load balancer. The application must also handle shared sessions and other state consistently.

### 7.4 Caching vs. Direct Database Reads

**Initial choice: Direct database reads**

Advantages:

* Simpler implementation.
* Fewer consistency problems.
* No separate cache infrastructure.

Disadvantages:

* Repeated reads increase database load.
* Response times may rise as traffic grows.

Caching may improve performance for suitable workloads, but cached data can become stale. Cache invalidation and consistency must be designed carefully.

### 7.5 SQL Database vs. Local Browser Storage

Local browser storage can be useful for a prototype or offline feature, but it is not a substitute for shared, server-side persistence in a multi-user application.

A backend with a database provides centralized storage, controlled access, and a clearer path to backups and recovery. It also introduces infrastructure and operational responsibilities.

## 8. Single Points of Failure

A single point of failure (SPOF) is a component whose failure can cause the entire system, or a critical part of it, to become unavailable.

### 8.1 Backend API

**Risk:** If only one backend instance runs and it crashes, users cannot create, retrieve, update, or delete notes through the API.

**Mitigation:**

* Run multiple backend instances for higher availability.
* Use health checks and a load balancer.
* Configure automatic restarts where appropriate.
* Monitor application errors and availability.

### 8.2 Database

**Risk:** If the only database becomes unavailable, most note operations will fail. If its data is lost, users may lose saved notes.

**Mitigation:**

* Schedule and monitor backups.
* Test restoration regularly.
* Use database replication or managed high-availability options when justified.
* Monitor disk capacity, connection limits, and database health.

Replication improves availability but does not replace backups, because accidental deletions or corrupted data may also be replicated.

### 8.3 Network and Hosting Infrastructure

**Risk:** A network outage or failure of the hosting environment can prevent users from reaching the application.

**Mitigation:**

* Use reliable hosting and network monitoring.
* Document recovery procedures.
* Consider redundant infrastructure when the application's availability requirements justify the cost.

### 8.4 DNS and Load Balancer

**Risk:** If all traffic depends on one DNS provider or one unprotected load-balancing component, its failure can prevent access even when the application servers are healthy.

**Mitigation:**

* Choose suitable managed services.
* Configure health checks and failover where supported.
* Review provider availability guarantees and recovery options.

### 8.5 Authentication Provider

**Risk:** If authentication depends entirely on an external identity provider, an outage may prevent users from signing in.

**Mitigation:**

* Monitor authentication failures.
* Design appropriate session handling.
* Document recovery procedures and provider dependencies.
* Do not weaken authorization checks as a workaround for an authentication outage.

### 8.6 Prioritizing Reliability

For the initial QuickNotes deployment, the most important priorities are:

1. Protect note data with reliable backups.
2. Monitor backend and database health.
3. Handle API and database errors gracefully.
4. Test restoring data from backups.
5. Add redundancy when actual availability needs justify the additional complexity and cost.

## 9. Security and Data Protection

The architecture should follow these practices:

* Use HTTPS in deployed environments.
* Validate inputs on the backend.
* Use parameterized database queries.
* Enforce authentication and authorization for private notes.
* Store secrets in environment variables or an appropriate secrets manager.
* Avoid logging passwords, tokens, or unnecessary private note contents.
* Apply sensible request-size limits and rate limits.
* Keep dependencies updated.
* Back up data securely and restrict access to backups.

Authentication and authorization are requirements for a multi-user production deployment; they should not be considered implemented until the relevant code and configuration exist.

## 10. Conclusion

The proposed QuickNotes architecture separates the frontend, backend API, and relational database. This separation supports maintainability, data integrity, and future growth without introducing unnecessary complexity at the beginning.

A single backend instance and database may be reasonable for a small initial deployment, but they create potential single points of failure. Monitoring, secure backups, recovery testing, and appropriate redundancy should be introduced according to the application's actual usage and reliability requirements.

The capacity figures in this document are planning assumptions. Load testing and production monitoring should be used to validate them as the system develops.
