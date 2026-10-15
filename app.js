"use strict";

const STORAGE_KEY = "people-contact-manager-contacts";
const GROUPS = ["Work", "Friends", "Family", "Other"];
const AVATAR_COLORS = [
  { background: "#f0ecfc", color: "#745ec4" },
  { background: "#edf2fc", color: "#6381c5" },
  { background: "#fff2ea", color: "#c68257" },
  { background: "#eaf5ef", color: "#5e9b7c" },
  { background: "#faedf2", color: "#ba6e8d" },
  { background: "#edf4f4", color: "#578c8c" },
];

const seedContacts = [
  { id: "sample-1", name: "Olivia Rhye", email: "olivia.rhye@example.com", phone: "+1 (415) 555-0132", group: "Work", company: "Layers", notes: "" },
  { id: "sample-2", name: "Phoenix Baker", email: "phoenix.baker@example.com", phone: "+1 (415) 555-0184", group: "Friends", company: "", notes: "" },
  { id: "sample-3", name: "Lana Steiner", email: "lana.steiner@example.com", phone: "+1 (415) 555-0167", group: "Work", company: "Circooles", notes: "" },
  { id: "sample-4", name: "Demi Wilkinson", email: "demi.wilkinson@example.com", phone: "+1 (415) 555-0119", group: "Family", company: "", notes: "" },
  { id: "sample-5", name: "Candice Wu", email: "candice.wu@example.com", phone: "+1 (415) 555-0190", group: "Friends", company: "Sisyphus", notes: "" },
  { id: "sample-6", name: "Natali Craig", email: "natali.craig@example.com", phone: "+1 (415) 555-0173", group: "Other", company: "", notes: "" },
];

const contactsList = document.querySelector("#contacts-list");
const dialog = document.querySelector("#contact-dialog");
const form = document.querySelector("#contact-form");
const searchInput = document.querySelector("#search-input");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyCopy = document.querySelector("#empty-copy");
const formError = document.querySelector("#form-error");
const saveButton = document.querySelector("#save-button");
const toast = document.querySelector("#toast");

let contacts = loadContacts();
let activeGroup = null;
let toastTimeout;

function loadContacts() {
  try {
    const savedContacts = localStorage.getItem(STORAGE_KEY);
    if (savedContacts === null) {
      return seedContacts.map((contact) => ({ ...contact }));
    }
    const parsedContacts = JSON.parse(savedContacts);
    if (!Array.isArray(parsedContacts)) {
      throw new Error("Saved contacts must be a list.");
    }
    return parsedContacts.filter(isValidContact);
  } catch (error) {
    console.error("Unable to load saved contacts.", error);
    showToast("Could not load saved contacts. Check your browser storage.");
    return seedContacts.map((contact) => ({ ...contact }));
  }
}

function isValidContact(contact) {
  return contact
    && typeof contact.id === "string"
    && typeof contact.name === "string"
    && typeof contact.email === "string"
    && typeof contact.phone === "string"
    && GROUPS.includes(contact.group)
    && typeof contact.company === "string"
    && typeof contact.notes === "string";
}

function saveContacts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    return true;
  } catch (error) {
    console.error("Unable to save contacts.", error);
    showToast("Could not save changes. Check your browser storage.");
    return false;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function colorForContact(name) {
  const hash = Array.from(name).reduce((total, character) => total + character.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function renderContacts() {
  const search = searchInput.value.trim().toLocaleLowerCase();
  const filteredContacts = contacts.filter((contact) => {
    const matchesGroup = !activeGroup || contact.group === activeGroup;
    const searchText = [contact.name, contact.email, contact.phone, contact.group, contact.company, contact.notes]
      .join(" ")
      .toLocaleLowerCase();
    return matchesGroup && (!search || searchText.includes(search));
  });

  contactsList.innerHTML = filteredContacts.map((contact) => {
    const color = colorForContact(contact.name);
    const company = contact.company ? `<span class="person-company">${escapeHtml(contact.company)}</span>` : "";
    const email = escapeHtml(contact.email);
    return `
      <tr>
        <td>
          <div class="person-cell">
            <span class="person-avatar" style="background:${color.background};color:${color.color}" aria-hidden="true">${escapeHtml(initials(contact.name))}</span>
            <span><span class="person-name">${escapeHtml(contact.name)}</span>${company}</span>
          </div>
        </td>
        <td><a class="email-link" href="mailto:${email}">${email}</a></td>
        <td>${escapeHtml(contact.phone || "—")}</td>
        <td><span class="group-badge" data-group="${escapeHtml(contact.group)}"><span class="group-dot ${contact.group.toLowerCase()}-dot"></span>${escapeHtml(contact.group)}</span></td>
        <td>
          <div class="action-buttons">
            <button class="icon-button edit-button" type="button" data-action="edit" data-id="${escapeHtml(contact.id)}" aria-label="Edit ${escapeHtml(contact.name)}" title="Edit contact">✎</button>
            <button class="icon-button delete-button" type="button" data-action="delete" data-id="${escapeHtml(contact.id)}" aria-label="Delete ${escapeHtml(contact.name)}" title="Delete contact">⌫</button>
          </div>
        </td>
      </tr>`;
  }).join("");

  const hasContacts = filteredContacts.length > 0;
  emptyState.hidden = hasContacts;
  contactsList.closest("table").hidden = !hasContacts;
  if (!hasContacts) {
    const hasFilters = Boolean(search || activeGroup);
    emptyTitle.textContent = hasFilters ? "No matching contacts" : "No contacts yet";
    emptyCopy.textContent = hasFilters
      ? "Try another search or group, or clear your search."
      : "Add your first contact and keep the important details close.";
    document.querySelector("#empty-add-button").hidden = hasFilters;
  }

  document.querySelector("#total-stat").textContent = contacts.length;
  document.querySelector("#work-stat").textContent = contacts.filter((contact) => contact.group === "Work").length;
  document.querySelector("#friends-stat").textContent = contacts.filter((contact) => contact.group === "Friends").length;
  document.querySelector("#family-stat").textContent = contacts.filter((contact) => contact.group === "Family").length;
  document.querySelector("#nav-count").textContent = contacts.length;
  document.querySelector("#contacts-count").textContent = filteredContacts.length;
  document.querySelector("#contacts-heading").firstChild.textContent = activeGroup ? `${activeGroup} contacts ` : "All contacts ";
  document.querySelector("#results-label").textContent =
    `Showing ${filteredContacts.length} of ${contacts.length} ${contacts.length === 1 ? "contact" : "contacts"}`;
}

function openCreateForm() {
  form.reset();
  document.querySelector("#contact-id").value = "";
  document.querySelector("#dialog-title").textContent = "Add a contact";
  saveButton.innerHTML = 'Save contact <span aria-hidden="true">→</span>';
  hideFormError();
  dialog.showModal();
  document.querySelector("#name").focus();
}

function openEditForm(id) {
  const contact = contacts.find((item) => item.id === id);
  if (!contact) return;

  form.elements.id.value = contact.id;
  form.elements.name.value = contact.name;
  form.elements.email.value = contact.email;
  form.elements.phone.value = contact.phone;
  form.elements.group.value = contact.group;
  form.elements.company.value = contact.company;
  form.elements.notes.value = contact.notes;
  document.querySelector("#dialog-title").textContent = "Edit contact";
  saveButton.innerHTML = 'Save changes <span aria-hidden="true">→</span>';
  hideFormError();
  dialog.showModal();
  document.querySelector("#name").focus();
}

function hideFormError() {
  formError.hidden = true;
  formError.textContent = "";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("visible"), 2800);
}

function closeDialog() {
  dialog.close();
  form.reset();
  hideFormError();
}

document.querySelector("#today-label").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
}).format(new Date());

document.querySelector("#add-contact-button").addEventListener("click", openCreateForm);
document.querySelector("#empty-add-button").addEventListener("click", openCreateForm);
document.querySelector("#close-dialog-button").addEventListener("click", closeDialog);
document.querySelector("#cancel-button").addEventListener("click", closeDialog);
searchInput.addEventListener("input", renderContacts);

document.querySelector(".group-nav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  activeGroup = activeGroup === button.dataset.filter ? null : button.dataset.filter;
  document.querySelectorAll(".group-link").forEach((link) => {
    link.classList.toggle("selected", link.dataset.filter === activeGroup);
    link.setAttribute("aria-pressed", String(link.dataset.filter === activeGroup));
  });
  renderContacts();
});

contactsList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (button.dataset.action === "edit") {
    openEditForm(button.dataset.id);
    return;
  }

  const contact = contacts.find((item) => item.id === button.dataset.id);
  if (!contact || !window.confirm(`Delete ${contact.name} from your contacts? This cannot be undone.`)) return;
  const previousContacts = contacts;
  contacts = contacts.filter((item) => item.id !== contact.id);
  if (saveContacts()) {
    renderContacts();
    showToast(`${contact.name} deleted.`);
  } else {
    contacts = previousContacts;
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  hideFormError();

  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const existingId = String(formData.get("id") || "");
  const email = String(formData.get("email")).trim();
  const duplicate = contacts.find((contact) => contact.email.toLocaleLowerCase() === email.toLocaleLowerCase() && contact.id !== existingId);
  if (duplicate) {
    formError.textContent = "A contact with this email address already exists.";
    formError.hidden = false;
    form.elements.email.focus();
    return;
  }

  const contact = {
    id: existingId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    name: String(formData.get("name")).trim(),
    email,
    phone: String(formData.get("phone")).trim(),
    group: String(formData.get("group")),
    company: String(formData.get("company")).trim(),
    notes: String(formData.get("notes")).trim(),
  };

  if (!contact.name || !contact.email) {
    formError.textContent = "Please enter a name and a valid email address.";
    formError.hidden = false;
    return;
  }

  const previousContacts = contacts;
  const isEditing = Boolean(existingId);
  contacts = isEditing
    ? contacts.map((item) => item.id === existingId ? contact : item)
    : [contact, ...contacts];

  if (!saveContacts()) {
    contacts = previousContacts;
    return;
  }

  closeDialog();
  renderContacts();
  showToast(isEditing ? `${contact.name} updated.` : `${contact.name} added.`);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !dialog.open && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});

renderContacts();
