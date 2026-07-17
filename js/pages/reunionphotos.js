import { API_BASE } from "../api/apiConfig.js";

import { getText, formatText } from "../services/textService.js";

let photos = [];
let currentIndex = 0;
let keyHandler = null;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function render() {
  return getText("reunionphotos.renderHtml", `
    <section class="reunion-photos-page">
      <header class="reunion-photos-header">
        <div class="reunion-eyebrow">REUNION 2026</div>
        <h1>Φωτογραφίες από το Reunion</h1>
        <p>
          Στιγμές από τη συνάντηση των αποφοίτων Ηλεκτρολόγων Μηχανικών
          του Πανεπιστημίου Πατρών, 50 χρόνια μετά.
        </p>
      </header>

      <div id="reunionPhotosMessage" class="reunion-photos-message">
        Φόρτωση φωτογραφιών...
      </div>

      <div id="reunionPhotosGrid" class="reunion-photos-grid" hidden></div>
    </section>

    <div id="reunionLightbox" class="reunion-lightbox hidden" role="dialog"
         aria-modal="true" aria-label="Προβολή φωτογραφίας">
      <button id="reunionClose" class="reunion-close" type="button" aria-label="Κλείσιμο">×</button>
      <button id="reunionPrev" class="reunion-nav reunion-prev" type="button" aria-label="Προηγούμενη">‹</button>

      <figure class="reunion-lightbox-content">
        <img id="reunionLightboxImage" alt="">
        <figcaption id="reunionLightboxCaption"></figcaption>
      </figure>

      <button id="reunionNext" class="reunion-nav reunion-next" type="button" aria-label="Επόμενη">›</button>
    </div>
  `);
}

export async function afterRender() {
  injectStyles();

  const message = document.getElementById("reunionPhotosMessage");
  const grid = document.getElementById("reunionPhotosGrid");

  try {
    const response = await fetch(`${API_BASE}/api/reunionphotos`, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    if (!Array.isArray(result.data)) {
      throw new Error(getText("reunionphotos.invalidApiData", "Η απάντηση του API δεν περιέχει πίνακα data."));
    }

    photos = result.data.filter(photo =>
      photo &&
      photo.show !== false &&
      String(photo.cloudUrl || "").trim()
    );

    if (!photos.length) {
      message.textContent = getText("reunionphotos.noPhotos", "Δεν υπάρχουν διαθέσιμες φωτογραφίες.");
      return;
    }

    const photoWord = photos.length === 1
      ? getText("reunionphotos.photoSingular", "φωτογραφία")
      : getText("reunionphotos.photoPlural", "φωτογραφίες");

    message.textContent = formatText(
      "reunionphotos.count",
      {
        count: photos.length,
        photoWord,
        database: result.databaseName || getText("reunionphotos.unknownDatabase", "άγνωστη")
      },
      `${photos.length} ${photoWord} · Βάση: ${result.databaseName || "άγνωστη"}`
    );

    grid.innerHTML = photos.map((photo, index) => {
      const title = String(photo.title || "").trim();
      const caption = String(photo.caption || "").trim();
      const alt = title || caption || formatText("reunionphotos.fallbackAlt", { number: index + 1 }, `Φωτογραφία Reunion ${index + 1}`);

      return `
        <article class="reunion-photo-card">
          <button class="reunion-photo-button" type="button"
                  data-index="${index}" aria-label="${escapeHtml(formatText("reunionphotos.enlargeAria", { alt }, `Μεγέθυνση: ${alt}`))}">
            <img src="${escapeHtml(photo.cloudUrl)}"
                 alt="${escapeHtml(alt)}"
                 loading="lazy"
                 decoding="async">
          </button>
          <div class="reunion-photo-info">
            ${title ? `<h2>${escapeHtml(title)}</h2>` : ""}
            ${caption ? `<p>${escapeHtml(caption)}</p>` : ""}
          </div>
        </article>
      `;
    }).join("");

    grid.hidden = false;
    attachEvents();
  } catch (error) {
    console.error("Reunion photos error:", error);
    message.innerHTML = `
      <strong>${getText("reunionphotos.loadErrorHtml", "Δεν ήταν δυνατή η φόρτωση των φωτογραφιών.")}</strong><br>
      <span>${escapeHtml(error.message || error)}</span>
    `;
  }
}

function attachEvents() {
  document.querySelectorAll(".reunion-photo-button").forEach(button => {
    button.addEventListener("click", () => {
      currentIndex = Number(button.dataset.index);
      openLightbox();
    });
  });

  document.getElementById("reunionClose")?.addEventListener("click", closeLightbox);
  document.getElementById("reunionPrev")?.addEventListener("click", showPrevious);
  document.getElementById("reunionNext")?.addEventListener("click", showNext);

  document.getElementById("reunionLightbox")?.addEventListener("click", event => {
    if (event.target.id === "reunionLightbox") closeLightbox();
  });

  if (keyHandler) document.removeEventListener("keydown", keyHandler);

  keyHandler = event => {
    const lightbox = document.getElementById("reunionLightbox");
    if (!lightbox || lightbox.classList.contains("hidden")) return;

    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") showPrevious();
    if (event.key === "ArrowRight") showNext();
  };

  document.addEventListener("keydown", keyHandler);
}

function openLightbox() {
  const lightbox = document.getElementById("reunionLightbox");
  if (!lightbox || !photos.length) return;

  showCurrentPhoto();
  lightbox.classList.remove("hidden");
  document.body.classList.add("reunion-lightbox-open");
}

function closeLightbox() {
  document.getElementById("reunionLightbox")?.classList.add("hidden");
  document.body.classList.remove("reunion-lightbox-open");
}

function showPrevious() {
  currentIndex = (currentIndex - 1 + photos.length) % photos.length;
  showCurrentPhoto();
}

function showNext() {
  currentIndex = (currentIndex + 1) % photos.length;
  showCurrentPhoto();
}

function showCurrentPhoto() {
  const photo = photos[currentIndex];
  if (!photo) return;

  const title = String(photo.title || "").trim();
  const caption = String(photo.caption || "").trim();
  const image = document.getElementById("reunionLightboxImage");
  const text = document.getElementById("reunionLightboxCaption");

  image.src = photo.cloudUrl;
  image.alt = title || caption || formatText("reunionphotos.fallbackAlt", { number: currentIndex + 1 }, `Φωτογραφία Reunion ${currentIndex + 1}`);

  text.innerHTML = `
    ${title ? `<strong>${escapeHtml(title)}</strong>` : ""}
    ${caption ? `<span>${escapeHtml(caption)}</span>` : ""}
  `;
}

function injectStyles() {
  if (document.getElementById("reunionPhotosStyles")) return;

  const style = document.createElement("style");
  style.id = "reunionPhotosStyles";
  style.textContent = `
    .reunion-photos-page {
      max-width: 1300px;
      margin: 0 auto;
      padding: 42px 28px 80px;
    }

    .reunion-photos-header {
      text-align: center;
      margin-bottom: 34px;
    }

    .reunion-eyebrow {
      color: #B8944A;
      font-size: .78rem;
      font-weight: 700;
      letter-spacing: .18em;
      margin-bottom: 10px;
    }

    .reunion-photos-header h1 {
      margin: 0 0 12px;
      font-size: clamp(2rem, 4vw, 3.2rem);
    }

    .reunion-photos-header p {
      max-width: 760px;
      margin: 0 auto;
      line-height: 1.65;
      opacity: .82;
    }

    .reunion-photos-message {
      text-align: center;
      margin-bottom: 24px;
      opacity: .82;
    }

    .reunion-photos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 22px;
    }

    .reunion-photo-card {
      overflow: hidden;
      border-radius: 14px;
      background: var(--surface, #fff);
      border: 1px solid var(--border, rgba(0,0,0,.12));
      box-shadow: 0 8px 24px rgba(0,0,0,.10);
    }

    .reunion-photo-button {
      display: block;
      width: 100%;
      padding: 0;
      border: 0;
      background: #111;
      cursor: zoom-in;
      overflow: hidden;
    }

    .reunion-photo-button img {
      display: block;
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      transition: transform .3s ease;
    }

    .reunion-photo-button:hover img {
      transform: scale(1.04);
    }

    .reunion-photo-info {
      padding: 16px 18px 18px;
    }

    .reunion-photo-info h2 {
      margin: 0 0 7px;
      color: #B8944A;
      font-size: 1rem;
    }

    .reunion-photo-info p {
      margin: 0;
      line-height: 1.5;
      opacity: .78;
    }

    .reunion-lightbox {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: grid;
      grid-template-columns: 60px minmax(0, 1fr) 60px;
      align-items: center;
      background: rgba(0,0,0,.94);
      padding: 54px 16px 18px;
    }

    .reunion-lightbox.hidden {
      display: none;
    }

    .reunion-lightbox-content {
      margin: 0;
      text-align: center;
      color: white;
    }

    .reunion-lightbox-content img {
      max-width: 100%;
      max-height: calc(100vh - 140px);
      object-fit: contain;
    }

    .reunion-lightbox-content figcaption {
      display: grid;
      gap: 5px;
      margin-top: 12px;
    }

    .reunion-close,
    .reunion-nav {
      border: 0;
      color: white;
      background: transparent;
      cursor: pointer;
    }

    .reunion-close {
      position: absolute;
      top: 8px;
      right: 18px;
      font-size: 2.7rem;
    }

    .reunion-nav {
      font-size: 3rem;
    }

    .reunion-close:hover,
    .reunion-nav:hover {
      color: #B8944A;
    }

    .reunion-lightbox-open {
      overflow: hidden;
    }

    @media (max-width: 650px) {
      .reunion-photos-page {
        padding: 28px 12px 60px;
      }

      .reunion-photos-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .reunion-photo-info {
        padding: 11px 12px 13px;
      }

      .reunion-lightbox {
        grid-template-columns: 34px minmax(0, 1fr) 34px;
        padding-inline: 4px;
      }

      .reunion-nav {
        font-size: 2.2rem;
      }
    }
  `;

  document.head.appendChild(style);
}
