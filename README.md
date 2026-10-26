# QuickNotes System Design

## Overview

QuickNotes is a notes application designed to help users create, organize, search, update, and delete notes. This repository documents the proposed system architecture, API design, and database model for the application. It explains how the main components communicate, how data is organized, and how the system can be designed for maintainability, security, reliability, and future growth.

## Project Objectives

* Define the system's functional and non-functional requirements.
* Design a REST-style API for note operations.
* Model the application's data and relationships.
* Illustrate the high-level system architecture.
* Estimate initial storage and request requirements.
* Identify architectural trade-offs and potential single points of failure.

## Documentation

The `docs/` directory contains the following documents:

| File                   | Description                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/api-design.md`   | Describes the proposed API endpoints, request and response formats, validation, and error handling.                                              |
| `docs/data-model.md`   | Describes the data entities, relationships, database schema, and example queries.                                                                |
| `docs/architecture.md` | Explains the system requirements, architecture diagram, components, capacity estimates, request flows, trade-offs, and single points of failure. |

## Proposed Architecture

The system follows a three-layer architecture:

1. **Frontend:** Provides the interface through which users manage their notes.
2. **Backend API:** Validates requests, applies business rules, enforces access controls, and communicates with the database.
3. **Relational database:** Stores notes and related information persistently.

The frontend communicates with the backend through HTTP requests, using JSON for data exchange. The backend is responsible for database access and enforcing application rules.

See [`docs/architecture.md`](docs/architecture.md) for the architecture diagram and detailed explanations.

## Main Features

The proposed system supports:

* Creating notes.
* Viewing saved notes.
* Searching notes.
* Updating existing notes.
* Deleting notes.
* Organizing notes using categories and, where implemented, tags.
* Validating input and returning meaningful error responses.

These are design goals; individual features should be considered implemented only when supported by working application code.

## Technology Considerations

The design considers the following technologies:

* **HTML, CSS, and JavaScript:** Frontend development.
* **REST-style HTTP API:** Communication between the frontend and backend.
* **JSON:** Request and response data format.
* **FastAPI or Express.js:** Possible backend frameworks.
* **SQLite or PostgreSQL:** Possible relational database choices.

These are proposed technology options, not a claim that every component has already been implemented or deployed.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/weyne-4/quicknotes-system-design.git
```

### 2. Open the project

```bash
cd quicknotes-system-design
```

### 3. Explore the documentation

Open the `docs/` directory and read the documents in this order:

1. `api-design.md`
2. `data-model.md`
3. `architecture.md`

This repository focuses on system design documentation. Running the complete application requires the corresponding frontend, backend, and database implementation.

## Design Decisions

The proposed initial design uses a relational database and a modular backend rather than introducing microservices immediately.

This approach aims to keep development and deployment manageable while supporting data integrity and future improvements.

Potential future enhancements include:

* Authentication and authorization.
* Database indexes and query optimization.
* Pagination for large note collections.
* Automated tests and monitoring.
* Database backups and recovery procedures.
* Multiple backend instances when higher availability is required.

## What I Learned

Through this project, I explored:

1. **API design:** How HTTP methods, endpoints, request bodies, responses, and error codes define interactions between clients and servers.
2. **Data modeling:** How entities, relationships, primary keys, and foreign keys organize application data.
3. **System architecture:** How frontend, backend, and database components work together.
4. **Capacity estimation:** How assumptions about users, notes, and requests help estimate initial system requirements.
5. **Reliability and trade-offs:** How single points of failure, backups, scaling, and architectural choices affect a system.
6. **Technical documentation:** How to organize system design decisions into clear, reusable documents.

## Project Status

This repository contains system design documentation for QuickNotes. The architecture, capacity estimates, and technology choices describe a proposed design and should be validated against an actual implementation and workload.

---

**Project:** QuickNotes System Design
**GitHub:** [weyne-4/quicknotes-system-design](https://github.com/weyne-4/quicknotes-system-design)
