const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadBtn = document.querySelector("#load-btn");
const form = document.querySelector("#note-form");
const title = document.querySelector("#title-input");
const body = document.querySelector("#body-input");
const submitBtn = document.querySelector("#submit-btn");
const status = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

// Display status messages using the appropriate CSS class.
function setStatus(message, state = "") {
    status.textContent = message;

    status.classList.remove(
        "status-loading",
        "status-success",
        "status-error",
        "status-empty"
    );

    if (state) {
        status.classList.add(`status-${state}`);
    }
}

// Reusable function for making API requests.
async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

// Create a note element safely using textContent.
function createNoteElement(note) {
    const item = document.createElement("li");
    const noteTitle = document.createElement("h3");
    const noteBody = document.createElement("p");
    const deleteBtn = document.createElement("button");

    noteTitle.textContent = note.title;
    noteBody.textContent = note.body;

    deleteBtn.textContent = "Delete";
    deleteBtn.type = "button";

    deleteBtn.addEventListener("click", () => {
        deleteNote(note.id, item, deleteBtn);
    });

    item.append(noteTitle, noteBody, deleteBtn);

    return item;
}

// GET: Load 10 notes.
async function loadNotes() {
    loadBtn.disabled = true;

    setStatus("Loading notes...", "loading");
    notesList.replaceChildren();

    try {
        const notes = await request(`${API_URL}?_limit=10`);

        if (notes.length === 0) {
            setStatus("No notes were found.", "empty");
            return;
        }

        notes.forEach((note) => {
            notesList.appendChild(createNoteElement(note));
        });

        setStatus(`Loaded ${notes.length} notes successfully.`, "success");
    } catch (error) {
        setStatus(
            "Sorry, we couldn't load the notes. Please try again.",
            "error"
        );

        console.error("Error loading notes:", error);
    } finally {
        loadBtn.disabled = false;
    }
}

// POST: Create a note.
async function createNote(event) {
    event.preventDefault();

    const noteTitle = title.value.trim();
    const noteBody = body.value.trim();

    if (!noteTitle) {
        setStatus("Please enter a title.", "error");
        title.focus();
        return;
    }

    if (noteTitle.length > 100) {
        setStatus("The title must not exceed 100 characters.", "error");
        title.focus();
        return;
    }

    submitBtn.disabled = true;

    setStatus("Creating note...", "loading");

    try {
        const newNote = await request(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: noteTitle,
                body: noteBody,
                userId: 1
            })
        });

        notesList.prepend(createNoteElement(newNote));

        setStatus(
            `Note created successfully (ID: ${newNote.id}).`,
            "success"
        );

        form.reset();
    } catch (error) {
        setStatus(
            "Sorry, we couldn't create your note. Please try again.",
            "error"
        );

        console.error("Error creating note:", error);
    } finally {
        submitBtn.disabled = false;
    }
}

// DELETE: Remove a note from the displayed list after a successful response.
async function deleteNote(noteId, noteElement, deleteBtn) {
    deleteBtn.disabled = true;

    setStatus("Deleting note...", "loading");

    try {
        await request(`${API_URL}/${noteId}`, {
            method: "DELETE"
        });

        noteElement.remove();

        setStatus(`Note ${noteId} deleted successfully.`, "success");
    } catch (error) {
        setStatus(
            `Sorry, we couldn't delete note ${noteId}. Please try again.`,
            "error"
        );

        console.error("Error deleting note:", error);
    } finally {
        deleteBtn.disabled = false;
    }
}

// Register each event listener once.
loadBtn.addEventListener("click", loadNotes);
form.addEventListener("submit", createNote);