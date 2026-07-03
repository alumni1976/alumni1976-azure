import { getMembers } from "../api/membersApi.js";
import { getAlumniEvents } from "../api/eventsApi.js";
import { createEventForm } from "../api/eventFormsApi.js";

let selectedMember = null;
let currentEvent = null;

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getEventId() {
  const hash = location.hash || "";
  const query = hash.includes("?") ? hash.split("?")[1] : "";
  const params = new URLSearchParams(query);

  return params.get("id") || "1";
}

function fullName(member) {
  return `${member.lastName || ""} ${member.firstName || ""}`.trim();
}

function displayName(member) {
  return `${member.firstName || ""} ${member.lastName || ""}`.trim();
}

function isDeceased(member) {
  return String(member.status || "active").trim().toLowerCase() === "deceased";
}

function formatGreekDate(dateValue) {
  if (!dateValue) return "-";

  const months = [
    "Ιανουαρίου",
    "Φεβρουαρίου",
    "Μαρτίου",
    "Απριλίου",
    "Μαΐου",
    "Ιουνίου",
    "Ιουλίου",
    "Αυγούστου",
    "Σεπτεμβρίου",
    "Οκτωβρίου",
    "Νοεμβρίου",
    "Δεκεμβρίου"
  ];

  const value = String(dateValue).trim();
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    const year = match[1];
    const monthIndex = Number(match[2]) - 1;
    const day = Number(match[3]);

    if (months[monthIndex]) {
      return `${day} ${months[monthIndex]} ${year}`;
    }
  }

  return value;
}

function formatGreekTime(timeValue) {
  if (!timeValue) return "-";

  const text = String(timeValue).trim();
  const match = text.match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return text;
  }

  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function memberPhotoMarkup(member, className = "") {
  const photo = String(member.photoLink || "").trim();
  const name = displayName(member) || fullName(member);

  if (photo) {
    return `
      <img
        class="${escapeHtml(className)}"
        src="${escapeHtml(photo)}"
        alt="${escapeHtml(name)}"
        loading="lazy"
      >
    `;
  }

  return `<div class="${escapeHtml(className)} event-member-avatar">👤</div>`;
}

function findEventById(events, eventId) {
  return events.find(event => String(event.id) === String(eventId)) || null;
}

export async function render() {
  return `
    <section class="event-registration-page">
      <p class="section-tag">Δήλωση Συμμετοχής</p>
      <h2>Δήλωση Συμμετοχής</h2>

      <div id="registrationEventSummary" class="registration-event-summary">
        <p>Φόρτωση εκδήλωσης...</p>
      </div>

      <form id="eventRegistrationForm" class="event-registration-form">
        <label>
          Απόφοιτος <span>*</span>
          <input
            id="eventMemberSearch"
            type="text"
            placeholder="Πληκτρολογήστε επώνυμο..."
            autocomplete="off"
          >
        </label>

        <div id="eventMemberOptions" class="event-member-options"></div>

        <div id="selectedMemberBox" class="selected-member-box hidden"></div>

        <label>
          Αριθμός συνοδών
          <select id="guestsCount">
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>

        <label>
          Συμμετοχή στο γεύμα
          <select id="mealParticipation">
            <option value="true">Ναι</option>
            <option value="false">Όχι</option>
          </select>
        </label>

        <label>
          Σχόλια
          <textarea id="eventComments" placeholder="Προαιρετικά σχόλια..."></textarea>
        </label>

        <button
          id="submitEventRegistration"
          class="btn-primary event-register-btn"
          type="submit"
        >
          Υποβολή Δήλωσης
        </button>

        <p id="registrationMessage" class="registration-message"></p>
      </form>
    </section>
  `;
}

export async function afterRender() {
  const eventId = getEventId();

  const eventSummary = document.getElementById("registrationEventSummary");
  const form = document.getElementById("eventRegistrationForm");
  const memberSearch = document.getElementById("eventMemberSearch");
  const memberOptions = document.getElementById("eventMemberOptions");
  const selectedMemberBox = document.getElementById("selectedMemberBox");
  const registrationMessage = document.getElementById("registrationMessage");
  const submitButton = document.getElementById("submitEventRegistration");
  const guestsCountInput = document.getElementById("guestsCount");
  const mealParticipationInput = document.getElementById("mealParticipation");
  const commentsInput = document.getElementById("eventComments");

  if (
    !eventSummary ||
    !form ||
    !memberSearch ||
    !memberOptions ||
    !selectedMemberBox ||
    !registrationMessage ||
    !submitButton ||
    !guestsCountInput ||
    !mealParticipationInput ||
    !commentsInput
  ) {
    return;
  }

  selectedMember = null;
  currentEvent = null;

  let members = [];

  try {
    const [events, allMembers] = await Promise.all([
      getAlumniEvents(),
      getMembers()
    ]);

    currentEvent = findEventById(events, eventId);

    if (!currentEvent) {
      eventSummary.innerHTML = `<p>Η εκδήλωση δεν βρέθηκε.</p>`;
      form.classList.add("hidden");
      return;
    }

    eventSummary.innerHTML = `
      <article class="registration-summary-card">
        <h3>${escapeHtml(currentEvent.title)}</h3>
        <p><strong>Ημερομηνία:</strong> ${escapeHtml(formatGreekDate(currentEvent.eventDate))}</p>
        <p><strong>Ώρα:</strong> ${escapeHtml(formatGreekTime(currentEvent.eventTime))}</p>
        <p><strong>Τοποθεσία:</strong> ${escapeHtml(currentEvent.location || "-")}</p>
      </article>
    `;

    members = allMembers
      .filter(member => !isDeceased(member))
      .sort((a, b) => fullName(a).localeCompare(fullName(b), "el"));

  } catch (err) {
    console.error("Error loading event registration data:", err);

    eventSummary.innerHTML = `<p>Αποτυχία φόρτωσης στοιχείων.</p>`;
    form.classList.add("hidden");
    return;
  }

  function renderMemberOptions(filter = "") {
    const q = filter.trim().toLowerCase();

    if (!q) {
      memberOptions.innerHTML = "";
      return;
    }

    const filtered = members
      .filter(member => fullName(member).toLowerCase().includes(q))
      .slice(0, 12);

    if (!filtered.length) {
      memberOptions.innerHTML =
        `<div class="event-member-option muted">Δεν βρέθηκε μέλος.</div>`;
      return;
    }

    memberOptions.innerHTML = filtered.map(member => `
      <button
        class="event-member-option"
        type="button"
        data-id="${escapeHtml(member.id)}"
      >
        <span class="event-member-option-thumb">
          ${memberPhotoMarkup(member, "event-member-thumb-img")}
        </span>

        <span class="event-member-option-name">
          ${escapeHtml(fullName(member))}
        </span>
      </button>
    `).join("");
  }

  memberSearch.addEventListener("input", () => {
    selectedMember = null;
    selectedMemberBox.classList.add("hidden");
    selectedMemberBox.innerHTML = "";
    renderMemberOptions(memberSearch.value);
  });

  memberOptions.addEventListener("click", event => {
    const button = event.target.closest(".event-member-option");

    if (!button || !button.dataset.id) return;

    selectedMember = members.find(
      member => String(member.id) === button.dataset.id
    );

    if (!selectedMember) return;

    memberSearch.value = fullName(selectedMember);
    memberOptions.innerHTML = "";

    selectedMemberBox.classList.remove("hidden");

    selectedMemberBox.innerHTML = `
      <div class="selected-member-card">
        <div class="selected-member-photo-wrap">
          ${memberPhotoMarkup(selectedMember, "selected-member-photo")}
        </div>

        <div class="selected-member-info">
          <strong>Επιλεγμένος απόφοιτος</strong>
          <h3>${escapeHtml(displayName(selectedMember))}</h3>
          ${
            selectedMember.email
              ? `<span>${escapeHtml(String(selectedMember.email).trim())}</span>`
              : ""
          }
        </div>
      </div>
    `;
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!selectedMember) {
      registrationMessage.textContent =
        "Παρακαλώ επιλέξτε απόφοιτο από τη λίστα.";
      return;
    }

    if (!currentEvent) {
      registrationMessage.textContent =
        "Δεν έχει επιλεγεί έγκυρη εκδήλωση.";
      return;
    }

    submitButton.disabled = true;
    registrationMessage.textContent = "Αποθήκευση δήλωσης...";

    const payload = {
      eventId: Number(currentEvent.id),
      memberId: Number(selectedMember.id),
      guestsCount: Number(guestsCountInput.value || 0),
      mealParticipation: mealParticipationInput.value === "true",
      comments: commentsInput.value.trim(),
      attendanceStatus: "registered",
      confirmationSent: false
    };

    try {
      await createEventForm(payload);

      form.reset();

      selectedMember = null;
      selectedMemberBox.classList.add("hidden");
      selectedMemberBox.innerHTML = "";
      memberOptions.innerHTML = "";

      registrationMessage.innerHTML =
        "✓ Η δήλωση συμμετοχής σας καταχωρήθηκε με επιτυχία.<br>Σας ευχαριστούμε.";

    } catch (err) {
      console.error("Error saving event registration:", err);

      const errorText = String(
        err?.message ||
        err?.details ||
        err?.hint ||
        err?.error ||
        ""
      ).toLowerCase();

      if (errorText.includes("duplicate")) {
        registrationMessage.textContent =
          "Υπάρχει ήδη δήλωση συμμετοχής για τον συγκεκριμένο απόφοιτο.";
        return;
      }

      registrationMessage.textContent =
        "Αποτυχία αποθήκευσης δήλωσης.";

    } finally {
      submitButton.disabled = false;
    }
  });
}