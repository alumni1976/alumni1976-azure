import { getOwnMember, updateOwnMember, changeOwnPassword } from "../api/membersApi.js";
import { isLoggedIn, updateCurrentUser } from "../auth.js";
import { getText } from "../services/textService.js";

export async function render() {
  if (!isLoggedIn()) {
    return `
      <div class="profs-header">
        <div class="profs-eyebrow">${getText("profile.tag", "ΤΟ ΠΡΟΦΙΛ ΜΟΥ")}</div>
        <h1>${getText("profile.title", "Τα στοιχεία μου")}</h1>
      </div>

      <main class="thinktank-main">
        <section class="thinktank-content">
          <article class="thinktank-card">
            <p>${getText(
              "profile.loginRequired",
              "Πρέπει να συνδεθείτε για να δείτε ή να επεξεργαστείτε τα στοιχεία σας."
            )}</p>
          </article>
        </section>
      </main>
    `;
  }

  return `
    <div class="profs-header">
      <div class="profs-eyebrow">${getText("profile.tag", "ΤΟ ΠΡΟΦΙΛ ΜΟΥ")}</div>
      <h1>${getText("profile.title", "Τα στοιχεία μου")}</h1>
      <p>${getText("profile.description", "Ενημερώστε τα προσωπικά σας στοιχεία.")}</p>
    </div>

    <main class="thinktank-main">
      <section class="thinktank-content">
        <article class="thinktank-card">
          <div id="profileLoading">
            <p>${getText("profile.loading", "Φόρτωση στοιχείων...")}</p>
          </div>

          <p class="thinktank-message" style="opacity:0.75;">
            ${getText("profile.requiredLegend", "* Υποχρεωτικό πεδίο")}
          </p>

          <form id="profileForm" class="hidden">
            <label class="auth-field-label">
              ${getText("profile.firstName", "Όνομα")} *
              <input type="text" id="profileFirstName" class="thinktank-input" required>
            </label>

            <label class="auth-field-label">
              ${getText("profile.lastName", "Επώνυμο")} *
              <input type="text" id="profileLastName" class="thinktank-input" required>
            </label>

            <label class="auth-field-label">
              ${getText("profile.vocativeFirstName", "Όνομα (κλητική)")} *
              <input type="text" id="profileVocativeFirstName" class="thinktank-input" required>
            </label>

            <label class="auth-field-label">
              ${getText("profile.vocativeLastName", "Επώνυμο (κλητική)")} *
              <input type="text" id="profileVocativeLastName" class="thinktank-input" required>
            </label>

            <label class="auth-field-label">
              ${getText("profile.email", "Email")} *
              <input type="email" id="profileEmail" class="thinktank-input" required>
            </label>

            <label class="auth-field-label">
              ${getText("profile.phone", "Τηλέφωνο")}
              <input type="text" id="profilePhone" class="thinktank-input">
            </label>

            <label class="auth-field-label">
              ${getText("profile.address", "Διεύθυνση")}
              <input type="text" id="profileAddress" class="thinktank-input">
            </label>

            <label class="auth-field-label">
              ${getText("profile.city", "Πόλη")}
              <input type="text" id="profileCity" class="thinktank-input">
            </label>

            <label class="auth-field-label">
              ${getText("profile.country", "Χώρα")}
              <input type="text" id="profileCountry" class="thinktank-input">
            </label>

            <label class="auth-field-label">
              ${getText("profile.birthDate", "Ημερομηνία γέννησης")}
              <input type="date" id="profileBirthDate" class="thinktank-input">
            </label>

            <label class="auth-field-label">
              ${getText("profile.remarks", "Σημειώσεις")}
              <textarea id="profileRemarks" class="thinktank-textarea"></textarea>
            </label>

            <button type="submit" id="profileSaveBtn" class="btn-primary thinktank-button">
              ${getText("profile.saveButton", "Αποθήκευση")}
            </button>

            <p id="profileMessage" class="thinktank-message"></p>
          </form>
        </article>

        <article class="thinktank-card">
          <div class="section-tag">${getText("profile.passwordTag", "ΑΣΦΑΛΕΙΑ")}</div>
          <h2>${getText("profile.passwordTitle", "Αλλαγή κωδικού πρόσβασης")}</h2>

          <form id="passwordForm">
            <label class="auth-field-label">
              ${getText("profile.currentPassword", "Τρέχων κωδικός")}
              <input type="password" id="profileCurrentPassword" class="thinktank-input" autocomplete="current-password">
            </label>

            <label class="auth-field-label">
              ${getText("profile.newPassword", "Νέος κωδικός")}
              <input type="password" id="profileNewPassword" class="thinktank-input" autocomplete="new-password">
            </label>

            <label class="auth-field-label">
              ${getText("profile.confirmNewPassword", "Επιβεβαίωση νέου κωδικού")}
              <input type="password" id="profileConfirmNewPassword" class="thinktank-input" autocomplete="new-password">
            </label>

            <button type="submit" id="passwordSaveBtn" class="btn-primary thinktank-button">
              ${getText("profile.changePasswordButton", "Αλλαγή κωδικού")}
            </button>

            <p id="passwordMessage" class="thinktank-message"></p>
          </form>
        </article>
      </section>
    </main>
  `;
}

export async function afterRender() {
  if (!isLoggedIn()) return;

  const loading = document.getElementById("profileLoading");
  const form = document.getElementById("profileForm");
  const message = document.getElementById("profileMessage");

  if (!form) return;

  try {
    const member = await getOwnMember();

    document.getElementById("profileFirstName").value = member?.firstName || "";
    document.getElementById("profileLastName").value = member?.lastName || "";
    document.getElementById("profileVocativeFirstName").value = member?.vocativeFirstName || "";
    document.getElementById("profileVocativeLastName").value = member?.vocativeLastName || "";
    document.getElementById("profileEmail").value = member?.email || "";
    document.getElementById("profilePhone").value = member?.phone || "";
    document.getElementById("profileAddress").value = member?.address || "";
    document.getElementById("profileCity").value = member?.city || "";
    document.getElementById("profileCountry").value = member?.country || "";
    document.getElementById("profileBirthDate").value = member?.birthDate || "";
    document.getElementById("profileRemarks").value = member?.remarks || "";

    loading?.classList.add("hidden");
    form.classList.remove("hidden");

  } catch (err) {
    console.error("Profile load error:", err);
    if (loading) {
      loading.innerHTML = `<p>${getText("profile.loadError", "Αποτυχία φόρτωσης στοιχείων.")}</p>`;
    }
    return;
  }

  // The browser's native "please fill this field" message follows the
  // browser/OS language, which may not match the page's Greek content —
  // this replaces it with a consistent Greek message for each required
  // field, cleared again as soon as the user types something.
  const requiredFieldMessage = getText(
    "profile.requiredFieldMessage",
    "Αυτό το πεδίο είναι υποχρεωτικό."
  );

  const requiredFieldIds = [
    "profileFirstName",
    "profileLastName",
    "profileVocativeFirstName",
    "profileVocativeLastName",
    "profileEmail"
  ];

  requiredFieldIds.forEach((id) => {
    const field = document.getElementById(id);
    if (!field) return;

    field.addEventListener("invalid", () => {
      field.setCustomValidity(requiredFieldMessage);
    });

    field.addEventListener("input", () => {
      field.setCustomValidity("");
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const saveBtn = document.getElementById("profileSaveBtn");
    saveBtn.disabled = true;
    message.textContent = getText("profile.saving", "Αποθήκευση...");

    const fields = {
      firstName: document.getElementById("profileFirstName").value.trim(),
      lastName: document.getElementById("profileLastName").value.trim(),
      vocativeFirstName: document.getElementById("profileVocativeFirstName").value.trim(),
      vocativeLastName: document.getElementById("profileVocativeLastName").value.trim(),
      email: document.getElementById("profileEmail").value.trim(),
      phone: document.getElementById("profilePhone").value.trim(),
      address: document.getElementById("profileAddress").value.trim(),
      city: document.getElementById("profileCity").value.trim(),
      country: document.getElementById("profileCountry").value.trim(),
      birthDate: document.getElementById("profileBirthDate").value || null,
      remarks: document.getElementById("profileRemarks").value.trim()
    };

    try {
      const updated = await updateOwnMember(fields);

      // Keep the nav's cached user (name shown in the auth flyout) in
      // sync with what was just saved, without requiring a re-login.
      updateCurrentUser({
        firstName: updated?.firstName,
        lastName: updated?.lastName,
        vocativeFirstName: updated?.vocativeFirstName,
        vocativeLastName: updated?.vocativeLastName
      });

      message.textContent = getText("profile.saveSuccess", "Τα στοιχεία σας αποθηκεύτηκαν.");

    } catch (err) {
      console.error("Profile save error:", err);
      message.textContent = err?.message || getText("profile.saveError", "Αποτυχία αποθήκευσης.");
    } finally {
      saveBtn.disabled = false;
    }
  });

  const passwordForm = document.getElementById("passwordForm");
  const passwordMessage = document.getElementById("passwordMessage");

  passwordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const saveBtn = document.getElementById("passwordSaveBtn");
    const currentInput = document.getElementById("profileCurrentPassword");
    const newInput = document.getElementById("profileNewPassword");
    const confirmInput = document.getElementById("profileConfirmNewPassword");

    const currentPassword = currentInput.value;
    const newPassword = newInput.value;
    const confirmPassword = confirmInput.value;

    if (!currentPassword || !newPassword) {
      passwordMessage.textContent = getText(
        "profile.passwordFieldsRequired",
        "Συμπληρώστε τον τρέχοντα και τον νέο κωδικό."
      );
      return;
    }

    if (newPassword.length < 8) {
      passwordMessage.textContent = getText(
        "profile.passwordTooShort",
        "Ο νέος κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      passwordMessage.textContent = getText(
        "profile.passwordMismatch",
        "Οι κωδικοί δεν ταιριάζουν."
      );
      return;
    }

    saveBtn.disabled = true;
    passwordMessage.textContent = getText("profile.saving", "Αποθήκευση...");

    try {
      await changeOwnPassword({ currentPassword, newPassword });

      passwordMessage.textContent = getText(
        "profile.passwordChanged",
        "Ο κωδικός σας άλλαξε."
      );

      currentInput.value = "";
      newInput.value = "";
      confirmInput.value = "";

    } catch (err) {
      console.error("Password change error:", err);
      passwordMessage.textContent = err?.message || getText(
        "profile.passwordChangeError",
        "Αποτυχία αλλαγής κωδικού."
      );
    } finally {
      saveBtn.disabled = false;
    }
  });
}