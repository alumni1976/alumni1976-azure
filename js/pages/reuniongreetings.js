import { getReunionData } from "../api/reunionApi.js";

function escHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initials(first, last) {
  return [(first || "")[0], (last || "")[0]]
    .filter(Boolean)
    .map(c => c.toUpperCase())
    .join("");
}

function renderCard(g, i) {
  const name = `${g.firstName || ""} ${g.lastName || ""}`.trim();
  const photo = g.photoLink || "";
  const text = (g.greeting || "").trim();

  const avatarHtml = photo
    ? `<img src="${escHtml(photo)}" alt="${escHtml(name)}" class="rg-avatar-img" loading="lazy">`
    : `<div class="rg-avatar-placeholder">${escHtml(initials(g.firstName, g.lastName))}</div>`;

  const bodyHtml = text
    .split(/\n\n+/)
    .map(p => `<p>${escHtml(p.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `
    <article class="rg-card" style="animation-delay:${i * 0.06}s">
      <div class="rg-card-header">
        <div class="rg-avatar">
          ${avatarHtml}
        </div>

        <div class="rg-card-meta">
          <strong class="rg-name">${escHtml(name)}</strong>
          <span class="rg-role">Απόφοιτος Ηλεκτρολόγων Μηχανικών 1976</span>
        </div>
      </div>

      <div class="rg-card-text">
        ${bodyHtml}
      </div>
    </article>
  `;
}

export async function render() {
  return `
    <div class="profs-header photos-header">
      <div class="profs-eyebrow">REUNION 2026</div>

      <h1>Εντυπώσεις <em>Πρωταγωνιστών</em></h1>

      <p>
        Τα συναισθήματα και οι σκέψεις των συναδέλφων
        μετά τη συνάντηση των 50 χρόνων.
      </p>
    </div>

    <main class="photos-main">
      <section class="photos-section">
        <div class="photos-section-head">
          <div>
            <p class="section-tag">ΜΗΝΥΜΑΤΑ ΜΕΛΩΝ</p>
            <h2>Τι είπαν οι πρωταγωνιστές</h2>
          </div>

          <div class="photos-count" id="rgCount"></div>
        </div>

        <div id="rgMessage" class="photos-message">
          Φόρτωση μηνυμάτων...
        </div>

        <div id="rgWall" class="rg-wall"></div>
      </section>
    </main>
  `;
}

export async function afterRender() {
  const wall = document.getElementById("rgWall");
  const message = document.getElementById("rgMessage");
  const countEl = document.getElementById("rgCount");

  if (!wall || !message) return;

  try {
    const data = await getReunionData();

    const greetings = data.filter(g =>
      (g.greeting || "").trim() !== ""
    );

    if (!greetings.length) {
      message.textContent = "Δεν υπάρχουν ακόμη μηνύματα.";
      if (countEl) countEl.textContent = "";
      return;
    }

    message.textContent = "";

    if (countEl) {
      countEl.textContent = `${greetings.length} μηνύματα`;
    }

    wall.innerHTML = greetings
      .map((g, i) => renderCard(g, i))
      .join("");

  } catch (err) {
    console.error("Error loading reunion greetings:", err);
    message.textContent = "Αποτυχία φόρτωσης μηνυμάτων.";
  }
}