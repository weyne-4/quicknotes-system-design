# QuickNotes System Architecture

## 1. Overview

QuickNotes is a notes application designed to let users create, view, search, update, and delete notes. This document describes a proposed architecture that can support growth from a small application to a service serving one million registered users.

The design separates the client, application servers, caching, database storage, and background processing. It also explains expected workload, request flows, architectural trade-offs, and measures to reduce single points of failure.

**Important:** This is a proposed design. The capacity estimates are based on explicit assumptions and have not been established through production measurements or load testing.

## 2. Requirements

### 2.1 Functional Requirements

The system should:

1. Allow users to create notes with a title, body, and category.
2. Allow users to retrieve, search, update, and delete notes.
3. Store notes persistently in a database.
4. Return JSON responses through a REST-style API.
5. Validate incoming requests and return useful error messages.
6. Authenticate users and restrict access to their own private notes.
7. Support pagination when users have many notes.
8. Perform non-critical background tasks, such as analytics or search indexing, through a queue and worker.

### 2.2 Non-Functional Requirements

**Performance:** Common API requests should return quickly under normal operating conditions.

**Scalability:** Application capacity should be expandable by adding application servers and increasing database capacity.

**Availability:** Failure of one application server should not make the entire API unavailable.

**Reliability:** The system should use persistent storage, backups, health checks, and recovery procedures to protect data and service availability.

**Security:** Communication should use HTTPS, sensitive operations should require authorization, and the backend should validate input.

**Consistency:** A successfully created note should be stored in the primary database. The system must account for potential replication lag when reading from a replica.

**Maintainability:** The client, backend, database, and background processing should have clearly defined responsibilities.

**Observability:** Logs, metrics, and alerts should help operators identify errors, slow requests, and component failures.

## 3. High-Level Architecture Diagram

```text
                        +----------------------+
                        |   Client / Browser   |
                        +----------+-----------+
                                   |
                             DNS resolution
                                   |
                        +----------v-----------+
                        |    Redundant DNS     |
                        +-----+-----------+----+
                              |           |
                    Static assets       API requests
                              |           |
                     +--------v---+   +---v----------------+
                     |    CDN     |   | Load Balancer      |
                     | Cached web |   | Health checks      |
                     | assets     |   +---+------------+---+
                     +-----+------+       |            |
                           |          +---v----+   +---v----+
                           +--------->| App A  |   | App B  |
                       Static assets  | Server |   | Server |
                                      +---+----+   +----+---+
                                          |             |
                                          +------+------+
                                                 |
                                    +------------+------------+
                                    |                         |
                              +-----v------+            +-----v------+
                              | Cache      |            | Primary DB |
                              | Cluster    |<-----------| Read/write |
                              +------------+            +-----+------+
                                                             |
                                                       Replication
                                                             |
                                                       +-----v------+
                                                       | Read       |
                                                       | Replica    |
                                                       +------------+

                     Background processing:

                     App Servers
                          |
                          v
                    +-----------+
                    | Durable   |
                    | Queue     |
                    +-----+-----+
                          |
                          v
                    +-----------+
                    | Worker    |
                    | Pool      |
                    +-----+-----+
                          |
                          v
                    Background tasks
              (analytics, notifications, indexing)
```

### Diagram Explanation

* The client uses DNS to find the application's network address.
* The CDN serves static frontend assets without requiring every request to reach an application server.
* API requests pass through the load balancer, which distributes them among healthy application servers.
* Application servers use the cache to reduce repeated database reads.
* The primary database handles writes and reads requiring the latest committed data.
* The read replica handles suitable read-heavy workloads and receives replicated data from the primary.
* Background jobs are placed in a durable queue and processed by workers independently of the main request flow.

The API should not be cached publicly by the CDN when doing so could expose private notes. The CDN primarily handles static assets; authenticated API responses require suitable private caching rules.

## 4. Component Explanations

### 4.1 Client

The client is the user's browser or mobile application, which displays notes and sends API requests.

**Problem solved:** It provides the interface through which users interact with the service.

### 4.2 DNS

DNS resolves the application's domain name to the appropriate network endpoint.

**Problem solved:** It allows users and applications to reach the service using a domain name rather than a hard-coded IP address.

### 4.3 Content Delivery Network (CDN)

The CDN caches and serves static frontend assets, such as CSS, JavaScript, and images, from geographically distributed locations.

**Problem solved:** It reduces static-content delivery latency and decreases traffic reaching the origin infrastructure.

### 4.4 Load Balancer

The load balancer distributes incoming API requests among healthy application servers and stops sending traffic to instances that fail health checks.

**Problem solved:** It avoids dependence on one application server and distributes requests across available capacity.

### 4.5 Application Servers

At least two application-server instances run the backend API, validate requests, enforce business rules, authorize access, and communicate with the database and other services.

**Problem solved:** Multiple instances improve resilience and allow capacity to increase without requiring a single increasingly powerful server.

### 4.6 Cache

A replicated cache cluster stores suitable frequently accessed data, such as recent note-query results, with an expiration policy.

**Problem solved:** It reduces repeated database queries and helps improve response times for cacheable reads.

Cache keys must include the relevant user identity, search terms, and pagination parameters so that one user cannot receive another user's private notes.

### 4.7 Primary Database

The primary relational database stores authoritative application data, including notes and associated records, and handles writes.

**Problem solved:** It provides persistent storage and transactional operations that maintain data integrity.

### 4.8 Read Replica

The read replica receives replicated database changes and handles suitable read-heavy requests that can tolerate replication lag.

**Problem solved:** It offloads eligible read traffic from the primary database.

A read replica does not automatically eliminate the primary database's single point of failure; a configured and tested failover process is also required.

### 4.9 Durable Queue

The queue stores background jobs so they can be processed asynchronously and retried when temporary failures occur.

**Problem solved:** It separates non-critical background work from the main API request path.

The queue should use durable, replicated storage and an appropriate job-retention policy.

### 4.10 Worker Pool

Multiple worker instances consume queued jobs and perform tasks such as analytics, notifications, or updating a search index.

**Problem solved:** Workers prevent non-critical processing from unnecessarily delaying user-facing API responses.

Jobs should be processed idempotently where possible, because retries can result in a job being delivered more than once.

## 5. Load Estimates for One Million Users

The following figures are planning assumptions rather than measured traffic. Actual resource requirements depend on user behavior, note sizes, query complexity, and peak concurrency.

### 5.1 Assumptions

| Metric                         |              Assumption |
| ------------------------------ | ----------------------: |
| Registered users               |               1,000,000 |
| Daily active users             | 10% of registered users |
| Daily active users, calculated |                 100,000 |
| Reads per active user per day  |                      20 |
| Writes per active user per day |                       2 |
| Average note payload           |                    2 KB |
| Peak-to-average traffic factor |                       5 |

For a conservative, easy-to-audit storage estimate, the model assumes that each write creates a new stored note of approximately 2 KB. Updates to existing notes may consume less additional storage than this model assumes, while attachments or larger notes would consume more.

### 5.2 Reads per Second

Daily reads:

100,000 active users × 20 reads per user = **2,000,000 reads per day**

Average reads per second:

2,000,000 ÷ 86,400 = **23.15 reads per second**

Estimated peak reads per second:

23.15 × 5 = **115.74 reads per second**

The rounded planning estimate is approximately **116 reads per second at peak**.

### 5.3 Writes per Second

Daily writes:

100,000 active users × 2 writes per user = **200,000 writes per day**

Average writes per second:

200,000 ÷ 86,400 = **2.31 writes per second**

Estimated peak writes per second:

2.31 × 5 = **11.57 writes per second**

The rounded planning estimate is approximately **12 writes per second at peak**.

These estimates count API reads and writes, not cache hits as database reads. Actual database traffic depends on the cache hit rate and the distribution of reads across database replicas.

### 5.4 Storage Growth per Year

Assumed new notes per year:

200,000 notes per day × 365 days = **73,000,000 notes per year**

Raw note storage:

73,000,000 notes × 2 KB = 146,000,000 KB per year.

Using decimal units, this is approximately **146 GB of new note payload per year**.

Allowing an additional 30% for estimated database metadata and indexes:

146 GB × 1.30 = **189.8 GB per year**

The planning estimate is therefore approximately **190 GB of additional primary-database storage per year**.

This estimate excludes separately stored attachments, logs, backups, and the extra storage used by a read replica. Replication and backups will increase the overall infrastructure storage requirement.

### 5.5 Capacity Planning

These estimates are starting points, not performance guarantees. Before production deployment, the system should be load-tested with representative note sizes, queries, authentication checks, and read/write patterns.

Monitoring should track API latency, error rates, cache hit rate, database utilization, queue depth, and worker processing time. Scaling decisions should follow measured bottlenecks.

## 6. Request Flow: GET /notes

The `GET /notes` endpoint retrieves the notes that the requesting user is authorized to view.

1. The client sends `GET /notes` over HTTPS.
2. DNS resolves the API hostname to the API entry point.
3. The load balancer forwards the request to a healthy application server.
4. The application server authenticates the request and checks the user's permissions.
5. The application server checks the cache using a key that includes the user identity and any relevant query or pagination parameters.
6. If a valid cache entry exists, the server returns the cached results.
7. If there is a cache miss, the server queries the read replica when replica data is sufficiently current for the operation.
8. If the replica is unavailable, the backend can use the primary database, subject to capacity and operational policies.
9. The application server returns a JSON response to the client and caches eligible results for a limited period.
10. The client displays the retrieved notes.

If the result depends on the latest write, the backend should read from the primary or otherwise use a consistency mechanism that prevents stale results from violating the application's requirements.

Pagination should be used for large collections so the server does not return every note in one response.

**Example success response:**

```json
{
  "data": [
    {
      "id": 101,
      "title": "Study plan",
      "body": "Review the system design notes."
    }
  ],
  "page": 1,
  "limit": 10
}
```

The response format is illustrative and should match the actual API contract.

## 7. Request Flow: POST /notes

The `POST /notes` endpoint creates a new note.

1. The client sends a `POST /notes` request containing the note's title, body, and category where supported.
2. DNS resolves the API hostname.
3. The load balancer forwards the request to a healthy application server.
4. The application server authenticates the user and validates the request. For example, the title must not be empty and must not exceed 100 characters.
5. The backend checks authorization and applies business rules.
6. The application server inserts the note into the primary database within a transaction.
7. After the database confirms the write, the application invalidates or updates affected cache entries.
8. The application schedules non-critical background work through the durable queue, such as updating a search index or recording analytics.
9. The backend returns `201 Created` with the new note's details.
10. The client displays the new note.

For reliable background processing, a transactional outbox or another reliable publication mechanism can prevent a committed database write from being silently lost when queue publication fails. Failed jobs should be retried and eventually moved to a dead-letter queue if they cannot be processed.

The API should not report a successful note creation until the database write has succeeded.

**Example request body:**

```json
{
  "title": "Study plan",
  "body": "Review the system design notes.",
  "category": "Study"
}
```

**Example success response:**

```json
{
  "id": 101,
  "title": "Study plan",
  "body": "Review the system design notes.",
  "category": "Study"
}
```

The response is illustrative; the final fields should follow the actual API design.

## 8. Architectural Trade-Offs

### 8.1 Caching vs. Consistency

**Choice:** Cache suitable frequently accessed note-query results.

**Advantages:**

* Reduces repeated database reads.
* Can improve response times.
* Can lower database resource consumption.

**Disadvantages:**

* Cached results may be stale.
* Cache invalidation introduces complexity.
* A cache outage can increase database load.

**Mitigation:** Set expiration policies, invalidate affected entries after writes, use user-scoped cache keys, and fall back to the database when the cache is unavailable. Operations that require the latest committed data should use the primary database or an equivalent consistency mechanism.

### 8.2 Read Replicas vs. Strong Read Consistency

**Choice:** Direct suitable read-heavy queries to a read replica.

**Advantages:**

* Offloads the primary database.
* Can increase read capacity.
* Separates some read traffic from the main write workload.

**Disadvantages:**

* Replication lag can cause stale reads.
* Replicas require monitoring and additional infrastructure.
* Replication does not by itself provide complete writer failover.

**Mitigation:** Send consistency-sensitive reads to the primary, monitor replica lag, and configure a tested procedure for promoting a replica or standby when the primary fails.

### 8.3 Multiple Application Servers vs. One Server

**Choice:** Run multiple application-server instances behind a load balancer.

**Advantages:**

* A single server failure does not necessarily interrupt the service.
* Traffic can be distributed across available instances.
* Additional instances can be added when demand increases.

**Disadvantages:**

* Infrastructure and monitoring become more complex.
* Shared state must not depend exclusively on one instance.
* Load balancing and health checks require correct configuration.

**Mitigation:** Distribute instances across failure domains, keep application servers stateless where possible, use shared services for persistent data, and test instance-failure scenarios.

### 8.4 Asynchronous Queue vs. Synchronous Processing

**Choice:** Use the queue for work that does not need to finish before responding to the user.

**Advantages:**

* Prevents background tasks from unnecessarily delaying API responses.
* Allows temporary processing backlogs to be managed independently.
* Supports retries for transient failures.

**Disadvantages:**

* Background results may not be available immediately.
* Queue and worker infrastructure introduce new operational dependencies.
* Retried jobs can execute more than once.

**Mitigation:** Use durable queue storage, multiple workers, retries with limits, idempotent job handling, monitoring, and a dead-letter queue.

## 9. Single Points of Failure and Their Mitigation

A single point of failure is a component whose failure can interrupt an essential part of the service.

### 9.1 DNS

**Risk:** An outage in the DNS service could prevent clients from resolving the application's domain.

**Mitigation:** Use a reliable DNS provider with redundant infrastructure and monitoring. For services requiring stronger resilience against provider-level outages, consider multi-provider DNS with a tested failover configuration.

### 9.2 CDN

**Risk:** A CDN outage could prevent clients from receiving static frontend assets through that CDN.

**Mitigation:** Keep the API endpoint independently reachable through its API hostname and load balancer. For stronger frontend resilience, configure an origin fallback or another tested delivery route.

### 9.3 Load Balancer

**Risk:** A single unprotected load-balancing instance could prevent API traffic from reaching otherwise healthy application servers.

**Mitigation:** Use a managed or redundant load-balancing service spanning appropriate failure domains, with health checks and failover.

### 9.4 Application Servers

**Risk:** An individual application-server failure interrupts requests assigned to that instance.

**Mitigation:** Maintain at least two application-server instances across separate failure domains. Use health checks so failed instances are removed from service, and keep application state in shared services rather than local instance memory.

### 9.5 Cache

**Risk:** A cache outage may increase latency and send a large volume of additional traffic to the database.

**Mitigation:** Use a cache cluster or replicated service where justified. Make the API capable of falling back to database reads, and monitor database capacity so cache failure does not cause cascading overload.

### 9.6 Primary Database

**Risk:** The primary database is a critical dependency for writes. A read replica alone does not ensure automatic or lossless writer failover.

**Mitigation:** Configure a suitable high-availability database deployment with a documented and tested promotion procedure, health checks, backups, and point-in-time recovery where supported. Use appropriate replication guarantees for the required recovery-point objective.

Asynchronous replication may lose recent changes if the primary fails before they reach the replica. The recovery design must acknowledge this risk rather than assuming that a replica automatically eliminates it.

### 9.7 Queue

**Risk:** An unavailable queue can block background processing and cause jobs to accumulate in the application if they are not handled safely.

**Mitigation:** Use durable replicated queue infrastructure, bounded producer retries, monitoring, and a recovery policy. Where necessary, use an outbox to retain jobs until they can be published successfully.

### 9.8 Workers

**Risk:** If a single worker fails, background tasks may stop processing.

**Mitigation:** Run multiple workers, use queue-based retry mechanisms, monitor processing delays, and route repeatedly failing jobs to a dead-letter queue for investigation.

### 9.9 Common Failure-Domain Risks

Redundancy is ineffective when every replica depends on the same vulnerable machine, zone, credential, or network path.

Application instances and critical supporting infrastructure should be spread across suitable failure domains where the deployment platform supports it. Backups should be protected against accidental deletion and tested through restoration exercises.

No architecture can guarantee that every provider-level or regional outage will have zero impact. The objective is to reduce the likelihood and duration of outages and to make data recovery predictable.

## 10. Reliability and Monitoring

The system should monitor:

* API request volume, latency, and error rates.
* Application-server health and resource utilization.
* Cache availability and hit rate.
* Primary database health and replica lag.
* Queue depth, failed jobs, and worker processing time.
* Backup completion and restoration readiness.

Alerts should identify failures before they cause prolonged disruption. Recovery procedures should be documented and tested rather than assumed to work.

Availability targets and recovery objectives should be selected based on business requirements and validated against the actual hosting platform.

## 11. Conclusion

The proposed QuickNotes architecture combines a CDN, load balancer, multiple application servers, a cache, a primary database, a read replica, and a durable queue with workers.

Under the stated assumptions, one million registered users generate an estimated average of approximately 23 reads per second and 2.3 writes per second, with planning peaks of roughly 116 reads per second and 12 writes per second. Estimated annual growth in raw note payload is 146 GB, or approximately 190 GB when allowing 30% for database metadata and indexes.

These figures must be validated through workload testing and monitoring. Redundant application instances, controlled cache fallback, database failover, durable background processing, backups, and recovery testing reduce critical dependencies and make the system more resilient as it grows.
