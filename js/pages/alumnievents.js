import { getAlumniEvents } from "../api/eventsApi.js";

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatGreekDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("el-GR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function formatGreekTime(timeValue) {
  if (!timeValue) return "";

  const text = String(timeValue).trim();

  const match = text.match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return text;
  }

  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function googleDriveImage(url, size = "w1600") {
  if (!url) return "";

  const cleanUrl = String(url).trim();

  const patterns = [
    /\/file\/d\/([^/]+)/,
    /\/d\/([^/]+)/,
    /[?&]id=([^&]+)/,
    /thumbnail\?id=([^&]+)/,
    /uc\?id=([^&]+)/
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);

    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=${size}`;
    }
  }

  return cleanUrl;
}

function isTrue(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

export async function render() {
  return `
    <section class="events-page">
      <p class="section-tag">Εκδηλώσεις</p>
      <h2>Εκδηλώσεις Αποφοίτων</h2>

      <p class="events-intro">
        Συναντήσεις, επετειακές εκδηλώσεις και στιγμές που συνεχίζουν
        την κοινή μας πορεία πενήντα χρόνια μετά.
      </p>

      <div id="eventsList" class="events-list">
        <p>Φόρτωση εκδηλώσεων...</p>
      </div>
    </section>
  `;
}

export async function afterRender() {
  const eventsList = document.getElementById("eventsList");

  if (!eventsList) return;

  try {
    const allEvents = await getAlumniEvents();

    const events = allEvents
      .filter(event => isTrue(event.active))
      .sort((a, b) => {
        const aSort = Number(a.sortOrder || 0);
        const bSort = Number(b.sortOrder || 0);

        if (aSort !== bSort) {
          return aSort - bSort;
        }

        return String(a.eventDate || "").localeCompare(String(b.eventDate || ""));
      });

    if (!events.length) {
      eventsList.innerHTML = `
        <article class="event-card">
          <h3>Δεν υπάρχουν προσεχείς εκδηλώσεις αυτή τη στιγμή.</h3>
          <p>
            Το Reunion 50 Ετών πραγματοποιήθηκε με μεγάλη επιτυχία στις
            20 Ιουνίου 2026. Δείτε το αναμνηστικό άρθρο στην
            <a href="#/home">αρχική σελίδα</a>.
          </p>
        </article>
      `;
      return;
    }

    eventsList.innerHTML = events.map(event => {
      const image = googleDriveImage(event.bannerImage, "w1800");
      const dateText = formatGreekDate(event.eventDate);
      const timeText = formatGreekTime(event.eventTime);

      return `
        <article class="event-card ${isTrue(event.featured) ? "event-card-featured" : ""}">
          ${
            image
              ? `
                <div class="event-image-wrap">
                  <img src="${escapeHtml(image)}" alt="${escapeHtml(event.title)}">
                </div>
              `
              : ""
          }

          <div class="event-content">
            <div class="event-date-box">
              <span>${escapeHtml(dateText)}</span>
              ${timeText ? `<small>${escapeHtml(timeText)}</small>` : ""}
            </div>

            <h3>${escapeHtml(event.title)}</h3>

            ${
              event.location
                ? `<p class="event-location">📍 ${escapeHtml(event.location)}</p>`
                : ""
            }

            <p class="event-description">
              ${escapeHtml(event.description || "")}
            </p>

            <a class="btn-primary event-register-btn" href="#/eventregistration?id=${escapeHtml(event.id)}">
              Δήλωση Συμμετοχής
            </a>
          </div>
        </article>
      `;
    }).join("");

  } catch (err) {
    console.error("Error loading alumni events:", err);

    eventsList.innerHTML = `
      <article class="event-card">
        <h3>Αποτυχία φόρτωσης εκδηλώσεων.</h3>
        <p>Παρακαλώ δοκιμάστε ξανά αργότερα.</p>
      </article>
    `;
  }
}