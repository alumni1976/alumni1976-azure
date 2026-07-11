import { getReunionData } from "../api/reunionApi.js";
import { API_BASE } from "../api/apiConfig.js";

function isTrue(value) {
  return value === true ||
    value === 1 ||
    value === "1" ||
    value === "true";
}

async function getReunionPhotos() {
  const response = await fetch(`${API_BASE}/api/reunionphotos`, {
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `Αποτυχία φόρτωσης φωτογραφιών: HTTP ${response.status}`
    );
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  if (!Array.isArray(result.data)) {
    throw new Error(
      "Η απάντηση του API φωτογραφιών δεν περιέχει πίνακα data."
    );
  }

  return result.data.filter(photo =>
    photo &&
    photo.show !== false &&
    String(photo.cloudUrl || "").trim() !== ""
  );
}

export async function render() {
  return `
    <div class="profs-header photos-header">
      <div class="profs-eyebrow">50 ΧΡΟΝΙΑ ΜΕΤΑ</div>
      <h1>Reunion <em>1976</em></h1>
      <p>20 Ιουνίου 2026 · Πρυτανεία Πανεπιστημίου Πατρών, Ρίο</p>
    </div>

    <main class="photos-main">
      <section class="photos-section">

        <div id="rdStats" class="rd-stats-grid">
          <div class="rd-stat-card skeleton"></div>
          <div class="rd-stat-card skeleton"></div>
          <div class="rd-stat-card skeleton"></div>
          <div class="rd-stat-card skeleton"></div>
        </div>

        <div class="rd-nav-grid">

          <a href="#/reuniongreetings" class="rd-nav-card">
            <div class="rd-nav-icon">💬</div>
            <h3>Εντυπώσεις Πρωταγωνιστών</h3>
            <p>
              Τα μηνύματα και συναισθήματα των συναδέλφων
              μετά τη συνάντηση
            </p>
            <span class="rd-nav-arrow">→</span>
          </a>

          <a href="#/reunionvideos" class="rd-nav-card">
            <div class="rd-nav-icon">🎥</div>
            <h3>Βίντεο Ομιλητών</h3>
            <p>
              Βίντεο-χαιρετισμοί των συναδέλφων από την εκδήλωση
            </p>
            <span class="rd-nav-arrow">→</span>
          </a>

          <a href="#/reunionphotos" class="rd-nav-card">
            <div class="rd-nav-icon">📸</div>
            <h3>Φωτογραφικό Υλικό</h3>
            <p>
              Στιγμές και αναμνήσεις από τη συνάντηση
            </p>
            <span class="rd-nav-arrow">→</span>
          </a>

          <a href="#/reunionattendees" class="rd-nav-card">
            <div class="rd-nav-icon">👥</div>
            <h3>Συμμετέχοντες</h3>
            <p>
              Οι συνάδελφοι που ήταν εκεί
            </p>
            <span class="rd-nav-arrow">→</span>
          </a>

        </div>

        <blockquote class="rd-quote">
          <p>
            «Ήμασταν εκεί. Τα ζήσαμε μαζί.
            Και παραμένουμε μια οικογένεια.»
          </p>
          <footer>
            — Alumni 1976, Ηλεκτρολόγοι Μηχανικοί
            Πανεπιστημίου Πατρών
          </footer>
        </blockquote>

      </section>
    </main>
  `;
}

export async function afterRender() {
  const statsGrid = document.getElementById("rdStats");

  if (!statsGrid) {
    return;
  }

  try {
    const [reunionData, photos] = await Promise.all([
      getReunionData(),
      getReunionPhotos()
    ]);

    const safeReunionData = Array.isArray(reunionData)
      ? reunionData
      : [];

    const greetings = safeReunionData.filter(item =>
      String(item.greeting || "").trim() !== ""
    );

    const videos = safeReunionData.filter(item =>
      String(item.cloudUrl || item.videoUrl || "").trim() !== ""
    );

    const attendees = safeReunionData.filter(item =>
      isTrue(item.attended)
    );

    const stats = [
      {
        icon: "💬",
        label: "Εντυπώσεις",
        value: greetings.length,
        href: "#/reuniongreetings"
      },
      {
        icon: "🎥",
        label: "Βίντεο",
        value: videos.length,
        href: "#/reunionvideos"
      },
      {
        icon: "📸",
        label: "Φωτογραφίες",
        value: photos.length,
        href: "#/reunionphotos"
      },
      {
        icon: "👥",
        label: "Παρόντες",
        value: attendees.length,
        href: "#/reunionattendees"
      }
    ];

    statsGrid.innerHTML = stats.map(stat => `
      <a href="${stat.href}" class="rd-stat-card">
        <span class="rd-stat-icon">${stat.icon}</span>
        <span class="rd-stat-value">${stat.value}</span>
        <span class="rd-stat-label">${stat.label}</span>
      </a>
    `).join("");

  } catch (error) {
    console.error(
      "Error loading reunion statistics:",
      error
    );

    statsGrid.innerHTML = `
      <div class="rd-stat-card">
        <span class="rd-stat-icon">⚠️</span>
        <span class="rd-stat-value">!</span>
        <span class="rd-stat-label">
          Σφάλμα φόρτωσης
        </span>
      </div>
    `;
  }
}