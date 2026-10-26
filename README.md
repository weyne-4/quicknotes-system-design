
# QuickNotes System Design

## Overview

QuickNotes is a note-taking application designed to help users create, view, search, update, and delete notes.

This repository contains a browser-based API client and system design documentation covering the proposed REST API, database model, and system architecture.

The API client uses JSONPlaceholder, a demonstration API, to practise HTTP requests. The documentation describes a proposed QuickNotes backend and database; these are not implemented by this repository.

## Project Objectives

* Build a browser-based API client using HTML, CSS, and JavaScript.
* Practise asynchronous HTTP requests using `fetch()` and `async/await`.
* Handle loading, success, error, and empty states.
* Design a REST API for note management.
* Model users, notes, tags, and their relationships.
* Document scalability, capacity estimates, and system reliability.

## Project Structure

```text
quicknotes-system-design/
├── index.html
├── api.js
├── style.css
├── README.md
└── docs/
    ├── api-design.md
    ├── data-model.md
    └── architecture.md
```

## Features

The API client includes:

* Loading up to 10 notes from the API.
* Creating notes through a form.
* Deleting notes from the displayed list.
* Validating note titles.
* Displaying loading, success, error, and empty messages.
* Disabling action buttons while requests are running.
* Safely displaying note text using `textContent`.

**Important:** JSONPlaceholder simulates POST and DELETE operations. Changes are not permanently stored by that demonstration service.

## Documentation

The `docs/` directory contains three system design documents.

### 1. API Design

[`docs/api-design.md`](docs/api-design.md)

Describes the proposed REST endpoints, HTTP methods, request and response examples, validation rules, and error status codes.

### 2. Data Model

[`docs/data-model.md`](docs/data-model.md)

Describes the database entities, primary keys, foreign keys, relationships, SQL table definitions, example queries, indexes, and database choice.

### 3. System Architecture

[`docs/architecture.md`](docs/architecture.md)

Describes functional and non-functional requirements, capacity estimates, architecture components, request flows, trade-offs, and single points of failure.

## How to Run the API Client

### Requirements

* A modern web browser.
* A code editor such as Visual Studio Code.
* The VS Code Live Server extension, or another local static web server.
* An internet connection to access JSONPlaceholder.

### Step 1: Clone the repository

Open Git Bash and run:

```bash
git clone https://github.com/weyne-4/quicknotes-system-design.git
```

### Step 2: Enter the project directory

```bash
cd quicknotes-system-design
```

### Step 3: Open the folder in VS Code

```bash
code .
```

If the `code` command is unavailable, open VS Code manually and select **File → Open Folder**, then choose the `quicknotes-system-design` directory.

### Step 4: Start Live Server

In VS Code:

1. Open `index.html`.
2. Right-click inside the editor.
3. Select **Open with Live Server**.

Your browser should open the API client using a local development address.

Alternatively, use another local static web server.

### Step 5: Test the application

1. Click **Load Notes** to retrieve notes from JSONPlaceholder.
2. Enter a title and optional body, then submit the form to create a demonstration note.
3. Click **Delete** beside a note to test a DELETE request.
4. Submit the form without a title to test validation.
5. Observe the status messages when requests succeed or fail.

The first load requires an internet connection because the application requests data from JSONPlaceholder.

### Troubleshooting

* If the page has no styling, confirm that `style.css` is in the project root and that `index.html` links to it.
* If the buttons do not work, open the browser developer tools and check the Console for JavaScript errors.
* If requests fail, check your internet connection and the Network tab in developer tools.
* If a created note disappears after reloading, remember that JSONPlaceholder does not permanently save demonstration POST operations.

## Technology Stack

| Technology      | Purpose                                                 |
| --------------- | ------------------------------------------------------- |
| HTML5           | Page structure and form elements                        |
| CSS3            | Styling and responsive layout                           |
| JavaScript      | DOM manipulation, validation, and asynchronous requests |
| Fetch API       | Communicating with the demonstration API                |
| JSONPlaceholder | Providing sample data and simulated API operations      |
| Markdown        | System design documentation                             |
| Git and GitHub  | Version control and project hosting                     |

## What I Learned

Through this project, I explored:

1. **API requests:** Using `fetch()`, `async/await`, and HTTP methods to communicate with a remote service.
2. **Error handling:** Using `try`, `catch`, and `finally` to handle failures and restore interface controls.
3. **DOM manipulation:** Creating elements and safely inserting text with `textContent`.
4. **Form validation:** Requiring a title and limiting it to 100 characters.
5. **Database design:** Using primary keys, foreign keys, constraints, indexes, and JOIN queries.
6. **System architecture:** Understanding how clients, application servers, caches, databases, queues, and workers interact.
7. **Scalability and reliability:** Estimating workloads and identifying single points of failure.
8. **Technical documentation:** Communicating design decisions through structured Markdown documents.

## Project Status

The browser-based API client uses JSONPlaceholder for demonstration purposes. The API contract, database schema, and scalable architecture documented in `docs/` represent the proposed design for a future QuickNotes backend.

The proposed production system would require an actual backend, a persistent database, appropriate authentication, and deployment configuration.

## Repository

**GitHub:** [weyne-4/quicknotes-system-design](https://github.com/weyne-4/quicknotes-system-design)
