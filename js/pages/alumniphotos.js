import { getAlumniPhotos } from "../api/alumniPhotosApi.js";

const PHOTOS_PER_VIEW = 2;
const SLIDE_INTERVAL_MS = 5000;
const FADE_DELAY_MS = 180;
const MIN_SLIDE_INTERVAL_SEC = 3;
const MAX_SLIDE_INTERVAL_SEC = 10;

let photos = [];
let currentPairIndex = 0;
let slideshowTimer = null;
let slideIntervalMs = SLIDE_INTERVAL_MS;

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function photoTitle(photo) {
  return String(photo.title || photo.caption || "Φωτογραφία Alumni 1976").trim() || "Φωτογραφία Alumni 1976";
}

function photoUrl(photo) {
  return String(photo.urlCloud || "").trim();
}

export async function render() {
  return `
    <div class="profs-header photos-header">
      <div class="profs-eyebrow">PHOTO ARCHIVE</div>

      <h1>Φωτογραφικό <em>Αρχείο</em></h1>

      <p>
        Στιγμές, πρόσωπα και αναμνήσεις από την κοινή πορεία των
        αποφοίτων Ηλεκτρολόγων Μηχανικών του 1976.
      </p>
    </div>

    <main class="photos-main">
      <section class="photos-section">
        <div class="photos-section-head">
          <div>
            <p class="section-tag">ΑΝΑΜΝΗΣΕΙΣ</p>
            <h2>Δύο στιγμές κάθε φορά</h2>
          </div>

          <div class="photos-count" id="photosCount"></div>
        </div>

        <div id="photosMessage" class="photos-message">
          Φόρτωση φωτογραφιών...
        </div>

        <div id="photoCarousel" class="photo-carousel hidden">
          <div id="photoPair" class="photo-pair"></div>

          <div id="photoSpeedControl" class="photo-speed-control">
            <label for="photoSpeedRange">
              Ταχύτητα εναλλαγής φωτογραφιών:
              <span id="photoSpeedValue">5</span>&nbsp;δευτερόλεπτα
            </label>

            <input
              type="range"
              id="photoSpeedRange"
              min="3"
              max="10"
              step="1"
              value="5"
            >
          </div>

          <div id="photoDots" class="photo-dots"></div>

          <div class="photo-carousel-toolbar">
            <button id="photoPrev" class="photo-carousel-btn" type="button">
              ← Προηγούμενες
            </button>

            <button id="photoNext" class="photo-carousel-btn" type="button">
              Επόμενες →
            </button>
          </div>
        </div>
      </section>
    </main>

    <div id="photoLightbox" class="photo-lightbox hidden" aria-hidden="true">
      <button id="photoLightboxClose" class="photo-lightbox-close" aria-label="Close photo">
        ×
      </button>

      <div class="photo-lightbox-inner">
        <img id="photoLightboxImg" src="" alt="">

        <div class="photo-lightbox-text">
          <h3 id="photoLightboxTitle"></h3>
        </div>
      </div>
    </div>
  `;
}

export async function afterRender() {
  const message = document.getElementById("photosMessage");
  const count = document.getElementById("photosCount");
  const carousel = document.getElementById("photoCarousel");

  if (!message || !carousel) return;

  stopSlideshow();

  try {
    const data = await getAlumniPhotos();

    photos = data
      .filter(photo => photoUrl(photo))
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

    if (!photos.length) {
      message.textContent = "Δεν υπάρχουν ακόμη φωτογραφίες.";
      if (count) count.textContent = "0 φωτογραφίες";
      return;
    }

    message.textContent = "";
    carousel.classList.remove("hidden");

    if (count) {
      count.textContent = `${photos.length} ${photos.length === 1 ? "φωτογραφία" : "φωτογραφίες"}`;
    }

    currentPairIndex = 0;
    renderPhotoPair(true);
    renderDots();
    attachCarouselEvents();
    startSlideshow();

  } catch (err) {
    console.error("Error loading alumni photos:", err);
    message.textContent = "Αποτυχία φόρτωσης φωτογραφιών.";
  }
}

function totalPairs() {
  return Math.ceil(photos.length / PHOTOS_PER_VIEW);
}

function getCurrentPairPhotos() {
  const start = currentPairIndex * PHOTOS_PER_VIEW;
  const pair = photos.slice(start, start + PHOTOS_PER_VIEW);

  if (pair.length === 1 && photos.length > 1) {
    pair.push(photos[0]);
  }

  return pair;
}

function renderPhotoPair(immediate = false) {
  const photoPair = document.getElementById("photoPair");

  if (!photoPair) return;

  if (!photoPair.dataset.initialized) {
    photoPair.innerHTML = Array.from({ length: PHOTOS_PER_VIEW }, () => `
      <article class="photo-slide-card">
        <div class="photo-slide-frame">
          <img
            src=""
            alt=""
            loading="lazy"
          >
        </div>

        <h3></h3>
      </article>
    `).join("");

    photoPair.dataset.initialized = "true";
  }

  photoPair.classList.remove("is-visible");

  const draw = () => {
    const currentPhotos = getCurrentPairPhotos();
    const cards = photoPair.querySelectorAll(".photo-slide-card");

    cards.forEach((card, index) => {
      const photo = currentPhotos[index];
      const img = card.querySelector("img");
      const heading = card.querySelector("h3");

      if (!photo) {
        card.classList.add("photo-empty");
        card.classList.remove("photo-error");
        card.removeAttribute("data-full");
        card.removeAttribute("data-title");

        if (img) {
          img.src = "";
          img.alt = "";
          img.onerror = null;
        }

        if (heading) heading.textContent = "";

        return;
      }

      const title = photoTitle(photo);
      const imgSrc = photoUrl(photo);

      card.classList.remove("photo-empty", "photo-error");
      card.dataset.full = imgSrc;
      card.dataset.title = title;

      if (img) {
        img.alt = title;
        img.onerror = () => card.classList.add("photo-error");

        if (img.getAttribute("src") !== imgSrc) {
          img.src = imgSrc;
        }
      }

      if (heading) heading.textContent = title;
    });

    attachPhotoEvents();
    photoPair.classList.add("is-visible");
  };

  if (immediate) {
    draw();
  } else {
    window.setTimeout(draw, FADE_DELAY_MS);
  }
}

function renderDots() {
  const dots = document.getElementById("photoDots");
  if (!dots) return;

  dots.innerHTML = Array.from({ length: totalPairs() }, (_, index) => `
    <button
      class="photo-dot ${index === currentPairIndex ? "active" : ""}"
      type="button"
      aria-label="Go to photo group ${index + 1}"
      data-index="${index}"
    ></button>
  `).join("");

  dots.querySelectorAll(".photo-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      currentPairIndex = Number(dot.dataset.index);
      renderPhotoPair();
      renderDots();
      restartSlideshow();
    });
  });
}

function nextPhotoPair() {
  if (!photos.length) return;

  currentPairIndex += 1;

  if (currentPairIndex >= totalPairs()) {
    currentPairIndex = 0;
  }

  renderPhotoPair();
  renderDots();
}

function previousPhotoPair() {
  if (!photos.length) return;

  currentPairIndex -= 1;

  if (currentPairIndex < 0) {
    currentPairIndex = totalPairs() - 1;
  }

  renderPhotoPair();
  renderDots();
}

function startSlideshow() {
  stopSlideshow();

  if (photos.length <= PHOTOS_PER_VIEW) return;

  slideshowTimer = window.setInterval(nextPhotoPair, slideIntervalMs);
}

function stopSlideshow() {
  if (slideshowTimer) {
    window.clearInterval(slideshowTimer);
    slideshowTimer = null;
  }
}

function restartSlideshow() {
  stopSlideshow();
  startSlideshow();
}

function attachCarouselEvents() {
  const prevBtn = document.getElementById("photoPrev");
  const nextBtn = document.getElementById("photoNext");
  const speedRange = document.getElementById("photoSpeedRange");
  const speedValue = document.getElementById("photoSpeedValue");

  if (prevBtn) {
    prevBtn.onclick = () => {
      previousPhotoPair();
      restartSlideshow();
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      nextPhotoPair();
      restartSlideshow();
    };
  }

  if (speedRange) {
    speedRange.value = String(Math.round(slideIntervalMs / 1000));

    if (speedValue) {
      speedValue.textContent = speedRange.value;
    }

    speedRange.oninput = () => {
      let seconds = Number(speedRange.value);

      if (Number.isNaN(seconds)) {
        seconds = SLIDE_INTERVAL_MS / 1000;
      }

      seconds = Math.min(
        Math.max(seconds, MIN_SLIDE_INTERVAL_SEC),
        MAX_SLIDE_INTERVAL_SEC
      );

      slideIntervalMs = seconds * 1000;

      if (speedValue) {
        speedValue.textContent = String(seconds);
      }

      restartSlideshow();
    };
  }
}

function attachPhotoEvents() {
  const lightbox = document.getElementById("photoLightbox");
  const lightboxImg = document.getElementById("photoLightboxImg");
  const lightboxTitle = document.getElementById("photoLightboxTitle");
  const closeBtn = document.getElementById("photoLightboxClose");

  if (!lightbox || !lightboxImg || !lightboxTitle) return;

  document.querySelectorAll(".photo-slide-card").forEach(card => {
    card.onclick = () => {
      const full = card.dataset.full || "";
      const title = card.dataset.title || "";

      if (!full) return;

      stopSlideshow();

      lightboxImg.src = full;
      lightboxImg.alt = title;
      lightboxTitle.textContent = title;

      lightbox.classList.remove("hidden");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-open");
    };
  });

  function closeLightbox() {
    lightbox.classList.add("hidden");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImg.src = "";
    document.body.classList.remove("lightbox-open");
    restartSlideshow();
  }

  if (closeBtn) {
    closeBtn.onclick = closeLightbox;
  }

  lightbox.onclick = event => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  };

  document.onkeydown = event => {
    if (event.key === "Escape" && !lightbox.classList.contains("hidden")) {
      closeLightbox();
    }
  };
}