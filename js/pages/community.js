import { getMembers } from "../api/membersApi.js";
import { getText } from "../services/textService.js";

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function hasValue(value) {
  return value && String(value).trim() !== "";
}

function linkValue(primary, cloud) {
  return hasValue(cloud)
    ? String(cloud).trim()
    : hasValue(primary)
      ? String(primary).trim()
      : "";
}

function buildLinks(member) {
  const links = [];

  const cvLink = linkValue(
    member.cvLink,
    member.cvLinkClord
  );

  const mediaLink = linkValue(
    member.mediaLink,
    member.mediaLinkClord
  );

  if (cvLink) {
    const qs = new URLSearchParams({
      cv: cvLink
    });

    links.push(`
      <a
        class="community-link-btn"
        href="cv-viewer.html?${qs.toString()}"
        target="_blank"
        rel="noopener"
      >
        ${getText("community.cvButton", "CV")}
      </a>
    `);
  }

  if (mediaLink) {
    links.push(`
      <a
        class="community-link-btn"
        href="${escapeHtml(mediaLink)}"
        target="_blank"
        rel="noopener"
      >
        ${getText("community.mediaButton", "Media")}
      </a>
    `);
  }

  if (cvLink && mediaLink) {
    const qs = new URLSearchParams({
      cv: cvLink,
      media_link: mediaLink
    });

    links.push(`
      <a
        class="community-link-btn community-link-btn-featured"
        href="cv-viewer.html?${qs.toString()}"
        target="_blank"
        rel="noopener"
      >
        ${getText("community.cvMediaButton", "CV & Media")}
      </a>
    `);
  }

  return links.join("");
}

function isDeceased(member) {
  return String(
    member.status || "active"
  ).trim().toLowerCase() === "deceased";
}

function resolvePhotoSrc(member) {
  return hasValue(member.photoLinkClord)
    ? String(member.photoLinkClord).trim()
    : "";
}

function displayName(member) {
  return `${member.firstName || ""} ${member.lastName || ""}`.trim();
}

export async function render() {
  return `
    <div class="community-header">
      <div class="community-eyebrow">
        ${getText("community.eyebrow", "ΑΠΟΦΟΙΤΟΙ 1976")}
      </div>

      <h1>
        ${getText("community.pageTitleStart", "Η")}
        <em>${getText("community.pageTitleEmphasis", "Κοινότητά")}</em>
        ${getText("community.pageTitleEnd", "μας")}
      </h1>

      <p>
        ${getText(
          "community.pageDescription",
          "Πρόσωπα, διαδρομές και αναμνήσεις από την κοινή πορεία των αποφοίτων της Σχολής Ηλεκτρολόγων Μηχανικών."
        )}
      </p>
    </div>

    <main class="community-main">
      <div id="communityGrid" class="community-grid">
        <div class="community-loading">
          ${getText(
            "community.loading",
            "Φόρτωση μελών..."
          )}
        </div>
      </div>
    </main>
  `;
}

export async function afterRender() {
  const grid = document.getElementById("communityGrid");

  if (!grid) return;

  try {
    const members = await getMembers();

    const visibleMembers = members.filter(member => {
      const first = hasValue(member.firstName);
      const last = hasValue(member.lastName);
      const photo = hasValue(member.photoLinkClord);

      return photo && (first || last);
    });

    if (!visibleMembers.length) {
      grid.innerHTML = `
        <div class="community-empty">
          ${getText(
            "community.noMembers",
            "Δεν βρέθηκαν μέλη για εμφάνιση."
          )}
        </div>
      `;

      return;
    }

    grid.innerHTML = visibleMembers.map(member => {
      const fullName = displayName(member);
      const nameLengthClass =
        fullName.length > 24
          ? " community-name-long"
          : fullName.length > 18
            ? " community-name-medium"
            : "";
      const photoSrc = resolvePhotoSrc(member);
      const links = buildLinks(member);
      const deceased = isDeceased(member);

      const footerContent = deceased
        ? `<div class="community-memorial">${getText(
            "community.memorial",
            "✝ Στη μνήμη"
          )}</div>`
        : links;

      return `
        <article class="community-card${deceased ? " community-card-deceased" : ""}">
          <div class="community-photo-frame">
            ${
              photoSrc
                ? `
                  <img
                    src="${escapeHtml(photoSrc)}"
                    alt="${escapeHtml(fullName)}"
                    loading="lazy"
                    onerror="this.closest('.community-photo-frame').classList.add('photo-missing'); this.remove();"
                  >
                `
                : `
                  <div class="community-photo-placeholder">
                    ${getText(
                      "community.noPhoto",
                      "Χωρίς φωτογραφία"
                    )}
                  </div>
                `
            }

            <div class="community-photo-shade"></div>
          </div>

          <div class="community-card-content">
            <div class="community-card-heading">
              <h3 class="community-name${nameLengthClass}">
                ${escapeHtml(fullName)}
              </h3>
            </div>

            ${
              footerContent
                ? `
                  <div class="community-links${deceased ? " community-links-memorial" : ""}">
                    ${footerContent}
                  </div>
                `
                : ""
            }
          </div>
        </article>
      `;
    }).join("");

  } catch (err) {
    console.error(
      "Error loading community members:",
      err
    );

    grid.innerHTML = `
      <div class="community-empty">
        ${getText(
          "community.loadError",
          "Αποτυχία φόρτωσης μελών."
        )}
      </div>
    `;
  }
}
