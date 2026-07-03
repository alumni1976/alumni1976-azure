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

function isDirectVideo(url) {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url || "");
}

function videoPoster(videoUrl) {
  if (!videoUrl) return null;

  const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;

  const vmMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) return `https://vumbnail.com/${vmMatch[1]}.jpg`;

  return null;
}

export async function render() {
  return `
    <div class="profs-header photos-header">
      <div class="profs-eyebrow">REUNION 2026</div>
      <h1>Βίντεο <em>Ομιλητών</em></h1>
      <p>Βίντεο-χαιρετισμοί των συναδέλφων από τη συνάντηση της 20ης Ιουνίου 2026.</p>
    </div>

    <main class="photos-main">
      <section class="photos-section">
        <div class="photos-section-head">
          <div>
            <p class="section-tag">ΒΙΝΤΕΟ ΑΡΧΕΙΟ</p>
            <h2>Ομιλητές &amp; Χαιρετισμοί</h2>
          </div>
          <div class="photos-count" id="rvCount"></div>
        </div>

        <div id="rvMessage" class="photos-message">Φόρτωση βίντεο...</div>

        <div id="rvGrid" class="rv-grid hidden"></div>
      </section>
    </main>

    <div id="rvModal" class="photo-lightbox hidden" aria-hidden="true">
      <button id="rvModalClose" class="photo-lightbox-close" aria-label="Κλείσιμο">×</button>

      <div class="photo-lightbox-inner rv-modal-inner">
        <div id="rvModalEmbed" class="rv-embed-wrap"></div>

        <div class="photo-lightbox-text">
          <h3 id="rvModalTitle"></h3>
        </div>
      </div>
    </div>
  `;
}

export async function afterRender() {
  const message = document.getElementById("rvMessage");
  const countEl = document.getElementById("rvCount");
  const grid = document.getElementById("rvGrid");

  if (!message || !grid) return;

  try {
    const data = await getReunionData();

    const videos = data.filter(v =>
      (v.videoUrl || "").trim() !== ""
    );

    if (!videos.length) {
      message.textContent = "Δεν υπάρχουν ακόμη βίντεο.";
      if (countEl) countEl.textContent = "";
      return;
    }

    message.textContent = "";
    grid.classList.remove("hidden");

    if (countEl) {
      countEl.textContent = `${videos.length} βίντεο`;
    }

    grid.innerHTML = videos.map(v => {
      const name = `${v.firstName || ""} ${v.lastName || ""}`.trim();
      const url = v.videoUrl || "";
      const photo = v.photoLink || "";
      const poster = videoPoster(url);

      let thumbHtml;

      if (photo) {
        thumbHtml = `
          <div class="rv-thumb rv-thumb-member">
            <img src="${escHtml(photo)}" alt="${escHtml(name)}" class="rv-member-photo" loading="lazy">
            <div class="rv-play-overlay">▶</div>
          </div>
        `;
      } else if (poster) {
        thumbHtml = `
          <div class="rv-thumb">
            <img src="${escHtml(poster)}" alt="${escHtml(name)}" loading="lazy" onerror="this.style.display='none'">
            <div class="rv-play-overlay">▶</div>
          </div>
        `;
      } else {
        thumbHtml = `
          <div class="rv-thumb rv-thumb-initials">
            <div class="rv-initials">${escHtml(initials(v.firstName, v.lastName))}</div>
            <div class="rv-play-overlay">▶</div>
          </div>
        `;
      }

      return `
        <article class="rv-card"
          data-url="${escHtml(url)}"
          data-name="${escHtml(name)}">
          ${thumbHtml}

          <div class="rv-card-body">
            <h3>${escHtml(name)}</h3>
            <p>Απόφοιτος Ηλεκτρολόγων Μηχανικών 1976</p>
          </div>
        </article>
      `;
    }).join("");

    attachVideoEvents();

  } catch (err) {
    console.error("Error loading reunion videos:", err);
    message.textContent = "Αποτυχία φόρτωσης βίντεο.";
  }
}

function attachVideoEvents() {
  const modal = document.getElementById("rvModal");
  const embedWrap = document.getElementById("rvModalEmbed");
  const titleEl = document.getElementById("rvModalTitle");
  const closeBtn = document.getElementById("rvModalClose");

  if (!modal || !embedWrap || !titleEl) return;

  document.querySelectorAll(".rv-card").forEach(card => {
    card.onclick = () => {
      const url = card.dataset.url || "";
      const name = card.dataset.name || "";

      titleEl.textContent = name;

      if (isDirectVideo(url)) {
        embedWrap.innerHTML = `
          <video class="rv-video-player" controls autoplay src="${escHtml(url)}"></video>
        `;
      } else {
        embedWrap.innerHTML = `
          <iframe class="rv-iframe"
            src="${escHtml(url)}"
            frameborder="0"
            allowfullscreen
            allow="autoplay; encrypted-media">
          </iframe>
        `;
      }

      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-open");
    };
  });

  const closeModal = () => {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    embedWrap.innerHTML = "";
    document.body.classList.remove("lightbox-open");
  };

  if (closeBtn) {
    closeBtn.onclick = closeModal;
  }

  modal.onclick = e => {
    if (e.target === modal) closeModal();
  };

  document.onkeydown = e => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  };
}