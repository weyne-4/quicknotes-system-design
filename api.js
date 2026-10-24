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
