const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadBtn = document.querySelector("#load-btn");
const form = document.querySelector("#note-form");
const title = document.querySelector("#title-input");
const body = document.querySelector("#body-input");
const submitBtn = document.querySelector("#submit-btn");
const status = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

// Reusable function for making API requests
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

// GET: Load 10 notes from the server
async function loadNotes() {
loadBtn.disabled = true;
status.textContent = "Loading notes...";
notesList.replaceChildren();


try {
    const notes = await request(`${API_URL}?_limit=10`);

    if (notes.length === 0) {
        status.textContent = "No notes were found.";
        return;
    }

    notes.forEach((note) => {
        const item = document.createElement("li");
        const noteTitle = document.createElement("h3");
        const noteBody = document.createElement("p");

        noteTitle.textContent = note.title;
        noteBody.textContent = note.body;

        item.append(noteTitle, noteBody);
        notesList.appendChild(item);
    });

    status.textContent = `Loaded ${notes.length} notes from the server.`;
} catch (error) {
    status.textContent =
        "Sorry, we couldn't load the notes. Please try again.";
    console.error("Error loading notes:", error);
} finally {
    loadBtn.disabled = false;
}


}

loadBtn.addEventListener("click", loadNotes);

async function createNote(event) {
event.preventDefault();

const noteTitle = title.value.trim();
const noteBody = body.value.trim();

// Validate the title
if (!noteTitle) {
    status.textContent = "Please enter a title.";
    title.focus();
    return;
}

if (noteTitle.length > 100) {
    status.textContent = "The title must not exceed 100 characters.";
    title.focus();
    return;
}

// Disable the submit button while the request runs
submitBtn.disabled = true;
status.textContent = "Creating note...";

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

    // Build the note safely using textContent
    const item = document.createElement("li");
    const noteHeading = document.createElement("h3");
    const noteBodyElement = document.createElement("p");

    noteHeading.textContent = newNote.title;
    noteBodyElement.textContent = newNote.body;

    item.append(noteHeading, noteBodyElement);

    // Add the new note at the top of the list
    notesList.prepend(item);

    status.textContent =
        `Note created (status 201, id ${newNote.id}).`;

    // Clear the form after success
    form.reset();
} catch (error) {
    status.textContent =
        "Sorry, we couldn't create your note. Please try again.";

    console.error("Error creating note:", error);
} finally {
    submitBtn.disabled = false;
}

}

form.addEventListener("submit", createNote);
loadBtn.addEventListener("click", loadNotes);

