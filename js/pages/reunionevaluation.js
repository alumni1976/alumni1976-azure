import { createReunionEvaluation } from "../api/reunionEvaluationApi.js";
import { getText } from "../services/textService.js";

const EVENT_RATING_FIELDS = [
  { id: "eventOverallRating", label: "Συνολική εντύπωση από την εκδήλωση" },
  { id: "organizationRating", label: "Οργάνωση" },
  { id: "programRating", label: "Πρόγραμμα εκδήλωσης" },
  { id: "venueRating", label: "Χώρος διεξαγωγής" },
  { id: "communicationRating", label: "Επικοινωνία πριν την εκδήλωση" },
  { id: "registrationExperienceRating", label: "Εμπειρία εγγραφής/δήλωσης συμμετοχής" }
];

const ratingValues = {};

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function starRatingMarkup(field) {
  return `
    <div class="rating-field" data-rating-id="${field.id}">
      <span class="rating-field-label">${escapeHtml(field.label)} <span>*</span></span>
      <div class="star-rating" role="radiogroup" aria-label="${escapeHtml(field.label)}">
        ${[1, 2, 3, 4, 5].map(value => `
          <button
            type="button"
            class="star-btn"
            data-rating-id="${field.id}"
            data-value="${value}"
            role="radio"
            aria-checked="false"
            aria-label="${value} από 5"
          >★</button>
        `).join("")}
      </div>
    </div>
  `;
}

function yesNoMarkup(id, label) {
  return `
    <div class="yesno-field" data-yesno-id="${id}">
      <span class="rating-field-label">${escapeHtml(label)}</span>
      <div class="yesno-toggle">
        <button type="button" class="yesno-btn" data-yesno-id="${id}" data-value="true">Ναι</button>
        <button type="button" class="yesno-btn" data-yesno-id="${id}" data-value="false">Όχι</button>
      </div>
    </div>
  `;
}

export async function render() {
  return getText("reunionevaluation.renderHtml", `
    <section class="evaluation-page">
      <p class="section-tag">Αξιολόγηση</p>
      <h2>Αξιολόγηση Reunion50</h2>

      <p>
        Η γνώμη σας μας βοηθά να βελτιώσουμε τις εκδηλώσεις της κοινότητας. Η συμπλήρωση
        διαρκεί περίπου 1 λεπτό.
      </p>

      <form id="reunionEvaluationForm" class="event-registration-form evaluation-form">

        <fieldset class="evaluation-group">
          <legend>Αξιολόγηση Εκδήλωσης</legend>
          ${EVENT_RATING_FIELDS.map(starRatingMarkup).join("")}
        </fieldset>

        <fieldset class="evaluation-group">
          <legend>Λίγα ακόμη</legend>
          ${yesNoMarkup("wouldAttendAgain", "Θα συμμετείχατε ξανά σε αντίστοιχη εκδήλωση;")}

          <label>
            Ποια ήταν η αγαπημένη σας στιγμή;
            <textarea id="favoriteMoment" placeholder="Προαιρετικό"></textarea>
          </label>

          <label>
            Τι θα βελτιώνατε στην εκδήλωση;
            <textarea id="eventImprovementSuggestions" placeholder="Προαιρετικό"></textarea>
          </label>

          <label>
            Επιπλέον σχόλια
            <textarea id="additionalComments" placeholder="Προαιρετικό"></textarea>
          </label>
        </fieldset>

        <fieldset class="evaluation-group">
          <legend>Στοιχεία (προαιρετικά)</legend>

          <label class="checkbox-label">
            <input type="checkbox" id="isAnonymous" checked>
            Προτιμώ να απαντήσω ανώνυμα
          </label>

          <div id="identityFields" class="identity-fields hidden">
            <label>
              Ονοματεπώνυμο
              <input type="text" id="fullName" placeholder="π.χ. Γιώργος Παπαδόπουλος">
            </label>

            <label>
              Email
              <input type="email" id="email" placeholder="name@example.com">
            </label>

            <label>
              Έτος αποφοίτησης
              <input type="number" id="graduationYear" min="1900" max="2100" placeholder="π.χ. 1976">
            </label>
          </div>
        </fieldset>

        <label class="checkbox-label">
          <input type="checkbox" id="consentToStoreData">
          Συμφωνώ με την αποθήκευση των παραπάνω στοιχείων για στατιστικούς σκοπούς
          <span>*</span>
        </label>

        <button
          id="submitEvaluationBtn"
          class="btn-primary event-register-btn"
          type="submit"
        >
          Υποβολή Αξιολόγησης
        </button>

        <p id="evaluationStatusMessage" class="registration-message"></p>
      </form>
    </section>
  `);
}

export async function afterRender() {
  const form = document.getElementById("reunionEvaluationForm");
  const statusMessage = document.getElementById("evaluationStatusMessage");
  const submitButton = document.getElementById("submitEvaluationBtn");
  const isAnonymousInput = document.getElementById("isAnonymous");
  const identityFields = document.getElementById("identityFields");
  const consentInput = document.getElementById("consentToStoreData");

  if (!form || !statusMessage || !submitButton || !isAnonymousInput || !identityFields || !consentInput) {
    return;
  }

  Object.keys(ratingValues).forEach(key => delete ratingValues[key]);
  const yesNoValues = {};

  isAnonymousInput.addEventListener("change", () => {
    identityFields.classList.toggle("hidden", isAnonymousInput.checked);
  });

  form.querySelectorAll(".star-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const { ratingId, value } = btn.dataset;
      ratingValues[ratingId] = Number(value);

      form.querySelectorAll(`.star-btn[data-rating-id="${ratingId}"]`).forEach(starBtn => {
        const active = Number(starBtn.dataset.value) <= Number(value);
        starBtn.classList.toggle("active", active);
        starBtn.setAttribute("aria-checked", String(starBtn.dataset.value === value));
      });
    });
  });

  form.querySelectorAll(".yesno-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const { yesnoId, value } = btn.dataset;
      yesNoValues[yesnoId] = value === "true";

      form.querySelectorAll(`.yesno-btn[data-yesno-id="${yesnoId}"]`).forEach(yesNoBtn => {
        yesNoBtn.classList.toggle("active", yesNoBtn.dataset.value === value);
      });
    });
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const missingRating = EVENT_RATING_FIELDS.find(field => !ratingValues[field.id]);

    if (missingRating) {
      statusMessage.textContent =
        getText("reunionevaluation.ratingRequired", `Παρακαλώ βαθμολογήστε: "${missingRating.label}".`);
      return;
    }

    if (!consentInput.checked) {
      statusMessage.textContent =
        getText("reunionevaluation.consentRequired", "Παρακαλώ αποδεχτείτε την αποθήκευση στοιχείων για να συνεχίσετε.");
      return;
    }

    const isAnonymous = isAnonymousInput.checked;

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const graduationYearRaw = document.getElementById("graduationYear").value.trim();

    const payload = {
      isAnonymous,
      fullName: isAnonymous ? null : (fullName || null),
      email: isAnonymous ? null : (email || null),
      graduationYear: isAnonymous || !graduationYearRaw ? null : Number(graduationYearRaw),

      eventOverallRating: ratingValues.eventOverallRating,
      organizationRating: ratingValues.organizationRating,
      programRating: ratingValues.programRating,
      venueRating: ratingValues.venueRating,
      communicationRating: ratingValues.communicationRating,
      registrationExperienceRating: ratingValues.registrationExperienceRating,

      wouldAttendAgain: yesNoValues.wouldAttendAgain ?? null,

      favoriteMoment: document.getElementById("favoriteMoment").value.trim() || null,
      eventImprovementSuggestions: document.getElementById("eventImprovementSuggestions").value.trim() || null,
      additionalComments: document.getElementById("additionalComments").value.trim() || null,

      consentToStoreData: consentInput.checked
    };

    submitButton.disabled = true;
    statusMessage.textContent = getText("reunionevaluation.saving", "Αποθήκευση αξιολόγησης...");

    try {
      await createReunionEvaluation(payload);

      form.reset();
      Object.keys(ratingValues).forEach(key => delete ratingValues[key]);
      Object.keys(yesNoValues).forEach(key => delete yesNoValues[key]);
      form.querySelectorAll(".star-btn.active, .yesno-btn.active")
        .forEach(el => el.classList.remove("active"));
      identityFields.classList.add("hidden");

      statusMessage.innerHTML =
        getText("reunionevaluation.successHtml", "✓ Ευχαριστούμε! Η αξιολόγησή σας καταχωρήθηκε με επιτυχία.");

    } catch (err) {
      console.error("Error saving reunion evaluation:", err);

      statusMessage.textContent =
        err?.message || getText("reunionevaluation.saveError", "Αποτυχία αποθήκευσης αξιολόγησης. Δοκιμάστε ξανά.");

    } finally {
      submitButton.disabled = false;
    }
  });
}
