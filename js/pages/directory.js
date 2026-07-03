import { getMembers } from "../api/membersApi.js";

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanText(value) {
  const text = String(value || "").trim();
  return text === "" ? "-" : text;
}

function fullName(member) {
  return `${member.lastName || ""} ${member.firstName || ""}`.trim();
}

function displayName(member) {
  return `${member.firstName || ""} ${member.lastName || ""}`.trim();
}

function initials(member) {
  return [
    (member.firstName || "")[0],
    (member.lastName || "")[0]
  ]
    .filter(Boolean)
    .map(c => c.toUpperCase())
    .join("");
}

function isDeceased(member) {
  return String(member.status || "").toLowerCase() === "deceased";
}

function memorialLabel(member) {
  return isDeceased(member) ? "✝ Στη μνήμη" : "";
}

function linkValue(primary, cloud) {
  return String(cloud || primary || "").trim();
}

export async function render() {
  return `
    <section class="directory-page">
      <p class="section-tag">Ευρετήριο</p>
      <h2>Ευρετήριο Αποφοίτων</h2>

      <p>Επιλέξτε απόφοιτο από τη λίστα.</p>

      <div class="member-search-box">
        <input id="memberSearch" type="text" placeholder="Αναζήτηση με επώνυμο..." autocomplete="off">
        <div id="memberOptions" class="member-options"></div>
      </div>

      <div id="memberDetails" class="member-details"></div>
    </section>
  `;
}

export async function afterRender() {
  const searchInput = document.getElementById("memberSearch");
  const optionsBox = document.getElementById("memberOptions");
  const detailsBox = document.getElementById("memberDetails");

  if (!searchInput || !optionsBox || !detailsBox) return;

  let members = [];

  try {
    members = await getMembers();
  } catch (err) {
    console.error("Error loading members:", err);
    optionsBox.innerHTML = `
      <div class="photos-message">
        Αποτυχία φόρτωσης μελών.
      </div>
    `;
    return;
  }

  function renderOptions(filter = "") {
    const q = filter.toLowerCase().trim();

    const filtered = members
      .filter(m => fullName(m).toLowerCase().includes(q))
      .sort((a, b) => fullName(a).localeCompare(fullName(b), "el"));

    if (!filtered.length) {
      optionsBox.innerHTML = `
        <div class="photos-message">
          Δεν βρέθηκε μέλος.
        </div>
      `;
      return;
    }

    optionsBox.innerHTML = filtered.map(m => {
      const deceased = isDeceased(m);
      const thumb = String(m.photoLink || "").trim();
      const name = fullName(m);
      const optionClass = deceased
        ? "member-option member-option-deceased"
        : "member-option";

      const disabledAttr = deceased
        ? ' aria-disabled="true" title="Στη μνήμη"'
        : "";

      return `
        <div class="${optionClass}" data-id="${escapeHtml(m.id)}"${disabledAttr}>
          <div class="member-option-thumb">
            ${
              thumb
                ? `<img src="${escapeHtml(thumb)}" alt="${escapeHtml(name)}" loading="lazy">`
                : `<span class="member-option-icon">${deceased ? "✝" : "👤"}</span>`
            }
          </div>

          <div class="member-option-text">
            <span>${escapeHtml(name)}</span>
            ${deceased ? `<small>${escapeHtml(memorialLabel(m))}</small>` : ""}
          </div>
        </div>
      `;
    }).join("");
  }

  function renderDetails(member) {
    const photo = String(member.photoLink || "").trim();
    const cvUrl = linkValue(member.cvLink, member.cvLinkClord);
    const mediaUrl = linkValue(member.mediaLink, member.mediaLinkClord);

    const avatar = `
      <div class="member-photo avatar-gold">
        ${escapeHtml(initials(member) || "👤")}
      </div>
    `;

    detailsBox.innerHTML = `
      <div class="member-card">
        ${
          photo
            ? `<img class="member-photo" src="${escapeHtml(photo)}" alt="${escapeHtml(displayName(member))}" loading="lazy">`
            : avatar
        }

        <div>
          <h3>${escapeHtml(displayName(member))}</h3>

          <p><strong>Email:</strong> ${escapeHtml(cleanText(member.email))}</p>
          <p><strong>Τηλέφωνο:</strong> ${escapeHtml(cleanText(member.phone))}</p>
          <p><strong>Διεύθυνση:</strong> ${escapeHtml(cleanText(member.address))}</p>

          <div class="member-actions">
            ${
              cvUrl
                ? `<a class="btn-primary" href="${escapeHtml(cvUrl)}" target="_blank" rel="noopener">CV</a>`
                : ""
            }

            ${
              mediaUrl
                ? `<a class="btn-primary" href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener">Media</a>`
                : ""
            }
          </div>
        </div>
      </div>
    `;

    searchInput.value = fullName(member);
  }

  searchInput.addEventListener("input", () => {
    renderOptions(searchInput.value);
  });

  optionsBox.addEventListener("click", e => {
    const option = e.target.closest(".member-option");
    if (!option) return;

    const member = members.find(m => String(m.id) === option.dataset.id);
    if (!member) return;

    if (isDeceased(member)) {
      return;
    }

    renderDetails(member);
  });

  renderOptions();
}