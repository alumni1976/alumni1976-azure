import { getMembers } from "../api/membersApi.js";
import { createContactForm } from "../api/contactApi.js";

let selectedMember = null;

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fullName(member) {
  return `${member.lastName || ""} ${member.firstName || ""}`.trim();
}

function displayName(member) {
  return `${member.firstName || ""} ${member.lastName || ""}`.trim();
}

function isDeceased(member) {
  return String(member.status || "").toLowerCase() === "deceased";
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

export async function render() {
  return `
    <section class="contact-page">
      <p class="section-tag">Επικοινωνία</p>
      <h2>Επικοινωνία</h2>

      <p>
        Για διορθώσεις στοιχείων, προτάσεις περιεχομένου ή τεχνικά θέματα
        σχετικά με την ιστοσελίδα, μπορείτε να στείλετε μήνυμα στον διαχειριστή.
      </p>

      <form id="contactForm" class="event-registration-form contact-form">
        <label>
          Απόφοιτος <span>*</span>
          <input
            id="contactMemberSearch"
            type="text"
            placeholder="Πληκτρολογήστε επώνυμο..."
            autocomplete="off"
          >
        </label>

        <div id="contactMemberOptions" class="event-member-options"></div>

        <div id="selectedContactMemberBox" class="selected-member-box hidden"></div>

        <label>
          Θέμα <span>*</span>
          <select id="contactSubject">
            <option value="">Επιλέξτε θέμα...</option>
            <option value="Γενική επικοινωνία">Γενική επικοινωνία</option>
            <option value="Διόρθωση στοιχείων">Διόρθωση στοιχείων</option>
            <option value="Πρόταση περιεχομένου">Πρόταση περιεχομένου</option>
            <option value="Τεχνικό πρόβλημα">Τεχνικό πρόβλημα</option>
            <option value="Άλλο">Άλλο</option>
          </select>
        </label>

        <label>
          Μήνυμα <span>*</span>
          <textarea
            id="contactMessage"
            placeholder="Γράψτε το μήνυμά σας..."
          ></textarea>
        </label>

        <button
          id="submitContactBtn"
          class="btn-primary event-register-btn"
          type="submit"
        >
          Αποστολή Μηνύματος
        </button>

        <p id="contactStatusMessage" class="registration-message"></p>
      </form>
    </section>
  `;
}

export async function afterRender() {
  const form = document.getElementById("contactForm");
  const memberSearch = document.getElementById("contactMemberSearch");
  const memberOptions = document.getElementById("contactMemberOptions");
  const selectedMemberBox = document.getElementById("selectedContactMemberBox");
  const subjectInput = document.getElementById("contactSubject");
  const messageInput = document.getElementById("contactMessage");
  const statusMessage = document.getElementById("contactStatusMessage");
  const submitButton = document.getElementById("submitContactBtn");

  if (
    !form ||
    !memberSearch ||
    !memberOptions ||
    !selectedMemberBox ||
    !subjectInput ||
    !messageInput ||
    !statusMessage ||
    !submitButton
  ) {
    return;
  }

  selectedMember = null;

  let members = [];

  try {
    const allMembers = await getMembers();

    members = allMembers
      .filter(member => !isDeceased(member))
      .sort((a, b) => fullName(a).localeCompare(fullName(b), "el"));

  } catch (err) {
    console.error("Error loading contact members:", err);

    statusMessage.textContent =
      "Αποτυχία φόρτωσης στοιχείων μελών.";

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
      statusMessage.textContent =
        "Παρακαλώ επιλέξτε απόφοιτο από τη λίστα.";
      return;
    }

    const subject = subjectInput.value.trim();
    const message = messageInput.value.trim();

    if (!subject) {
      statusMessage.textContent = "Παρακαλώ επιλέξτε θέμα.";
      return;
    }

    if (!message) {
      statusMessage.textContent = "Παρακαλώ γράψτε μήνυμα.";
      return;
    }

    submitButton.disabled = true;
    statusMessage.textContent = "Αποθήκευση μηνύματος...";

    try {
      await createContactForm({
        memberId: Number(selectedMember.id),
        subject,
        message,
        status: "new",
        emailSent: false
      });

      form.reset();

      selectedMember = null;
      selectedMemberBox.classList.add("hidden");
      selectedMemberBox.innerHTML = "";
      memberOptions.innerHTML = "";

      statusMessage.innerHTML =
        "✓ Το μήνυμά σας καταχωρήθηκε με επιτυχία.<br>Σας ευχαριστούμε.";

    } catch (err) {
      console.error("Error saving contact form:", err);

      statusMessage.textContent =
        err?.message || "Αποτυχία αποθήκευσης μηνύματος.";

    } finally {
      submitButton.disabled = false;
    }
  });
}