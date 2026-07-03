const DATA_URL = './assets/data/photos.json';

const PHOTOS_PER_VIEW   = 2;
const SLIDE_INTERVAL_MS = 5000;
const FADE_DELAY_MS     = 180;

let photos = [];
let currentPairIndex = 0;
let slideshowTimer   = null;
let slideIntervalMs  = SLIDE_INTERVAL_MS;

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function photoUrl(p)   { return String(p.url_cloud || p.imgurl || p.cloud_url || '').trim(); }
function photoTitle(p) { return String(p.title || p.first_name && `${p.first_name} ${p.last_name}` || 'Φωτογραφία').trim(); }

export async function render() {
  return `
    <div class="profs-header photos-header">
      <div class="profs-eyebrow">REUNION 2026</div>
      <h1>Φωτογραφικό <em>Υλικό</em></h1>
      <p>Στιγμές από τη συνάντηση των 50 χρόνων στο Πανεπιστήμιο Πατρών, 20 Ιουνίου 2026.</p>
    </div>
    <main class="photos-main">
      <section class="photos-section">
        <div class="photos-section-head">
          <div>
            <p class="section-tag">ΑΝΑΜΝΗΣΤΙΚΕΣ ΣΤΙΓΜΕΣ</p>
            <h2>Δύο φωτογραφίες κάθε φορά</h2>
          </div>
          <div class="photos-count" id="rpCount"></div>
        </div>
        <div id="rpMessage" class="photos-message">Φόρτωση φωτογραφιών...</div>
        <div id="rpCarousel" class="photo-carousel hidden">
          <div id="rpPair" class="photo-pair"></div>
          <div class="photo-speed-control">
            <label for="rpSpeedRange">Ταχύτητα: <span id="rpSpeedValue">5</span>&nbsp;δευτ.</label>
            <input type="range" id="rpSpeedRange" min="3" max="10" step="1" value="5">
          </div>
          <div id="rpDots" class="photo-dots"></div>
          <div class="photo-carousel-toolbar">
            <button id="rpPrev" class="photo-carousel-btn" type="button">← Προηγούμενες</button>
            <button id="rpNext" class="photo-carousel-btn" type="button">Επόμενες →</button>
          </div>
        </div>
        <div id="rpEmpty" class="rg-card hidden" style="text-align:center;padding:3rem">
          <p style="font-size:1.1rem;color:var(--muted)">📸 Οι φωτογραφίες θα αναρτηθούν σύντομα…</p>
        </div>
      </section>
    </main>
    <div id="rpLightbox" class="photo-lightbox hidden" aria-hidden="true">
      <button id="rpLightboxClose" class="photo-lightbox-close" aria-label="Κλείσιμο">×</button>
      <div class="photo-lightbox-inner">
        <img id="rpLightboxImg" src="" alt="">
        <div class="photo-lightbox-text">
          <h3 id="rpLightboxTitle"></h3>
        </div>
      </div>
    </div>
  `;
}

export async function afterRender() {
  const message = document.getElementById('rpMessage');
  const countEl = document.getElementById('rpCount');
  const carousel= document.getElementById('rpCarousel');
  const emptyEl = document.getElementById('rpEmpty');
  stopSlideshow();

  try {
    const res  = await fetch(DATA_URL);
    photos = (await res.json()).filter(p => photoUrl(p));

    message.textContent = '';

    if (!photos.length) {
      emptyEl.classList.remove('hidden');
      if (countEl) countEl.textContent = '0 φωτογραφίες';
      return;
    }

    carousel.classList.remove('hidden');
    if (countEl) countEl.textContent = `${photos.length} ${photos.length === 1 ? 'φωτογραφία' : 'φωτογραφίες'}`;
    currentPairIndex = 0;
    renderPair(true);
    renderDots();
    attachCarouselEvents();
    startSlideshow();

  } catch (err) {
    console.error(err);
    message.textContent = 'Αποτυχία φόρτωσης φωτογραφιών.';
  }
}

function totalPairs() { return Math.ceil(photos.length / PHOTOS_PER_VIEW); }

function getCurrentPair() {
  const start = currentPairIndex * PHOTOS_PER_VIEW;
  const pair  = photos.slice(start, start + PHOTOS_PER_VIEW);
  if (pair.length === 1 && photos.length > 1) pair.push(photos[0]);
  return pair;
}

function renderPair(immediate = false) {
  const pairEl = document.getElementById('rpPair');
  if (!pairEl) return;
  if (!pairEl.dataset.initialized) {
    pairEl.innerHTML = Array.from({ length: PHOTOS_PER_VIEW }, () => `
      <article class="photo-slide-card">
        <div class="photo-slide-frame"><img src="" alt="" loading="lazy"></div>
        <h3></h3>
      </article>`).join('');
    pairEl.dataset.initialized = 'true';
  }
  pairEl.classList.remove('is-visible');
  const draw = () => {
    const cur = getCurrentPair();
    pairEl.querySelectorAll('.photo-slide-card').forEach((card, i) => {
      const p   = cur[i];
      const img = card.querySelector('img');
      const h3  = card.querySelector('h3');
      if (!p) { card.classList.add('photo-empty'); img && (img.src=''); h3 && (h3.textContent=''); return; }
      card.classList.remove('photo-empty','photo-error');
      card.dataset.full  = photoUrl(p);
      card.dataset.title = photoTitle(p);
      if (img) { img.alt = photoTitle(p); img.onerror = () => card.classList.add('photo-error'); if (img.src !== photoUrl(p)) img.src = photoUrl(p); }
      if (h3)  h3.textContent = photoTitle(p);
    });
    attachPhotoEvents();
    pairEl.classList.add('is-visible');
  };
  immediate ? draw() : setTimeout(draw, FADE_DELAY_MS);
}

function renderDots() {
  const dots = document.getElementById('rpDots');
  if (!dots) return;
  dots.innerHTML = Array.from({ length: totalPairs() }, (_, i) =>
    `<button class="photo-dot ${i===currentPairIndex?'active':''}" type="button" data-index="${i}" aria-label="Ομάδα ${i+1}"></button>`
  ).join('');
  dots.querySelectorAll('.photo-dot').forEach(d => {
    d.addEventListener('click', () => { currentPairIndex=Number(d.dataset.index); renderPair(); renderDots(); restartSlideshow(); });
  });
}

function nextPair() { if (!photos.length) return; currentPairIndex=(currentPairIndex+1)%totalPairs(); renderPair(); renderDots(); }
function prevPair() { if (!photos.length) return; currentPairIndex=(currentPairIndex-1+totalPairs())%totalPairs(); renderPair(); renderDots(); }
function startSlideshow() { stopSlideshow(); if (photos.length>PHOTOS_PER_VIEW) slideshowTimer=setInterval(nextPair,slideIntervalMs); }
function stopSlideshow()  { if (slideshowTimer) { clearInterval(slideshowTimer); slideshowTimer=null; } }
function restartSlideshow(){ stopSlideshow(); startSlideshow(); }

function attachCarouselEvents() {
  const prevBtn    = document.getElementById('rpPrev');
  const nextBtn    = document.getElementById('rpNext');
  const speedRange = document.getElementById('rpSpeedRange');
  const speedValue = document.getElementById('rpSpeedValue');
  if (prevBtn)    prevBtn.onclick = () => { prevPair(); restartSlideshow(); };
  if (nextBtn)    nextBtn.onclick = () => { nextPair(); restartSlideshow(); };
  if (speedRange) speedRange.oninput = () => {
    let s = Math.min(Math.max(Number(speedRange.value),3),10);
    slideIntervalMs = s*1000;
    if (speedValue) speedValue.textContent = String(s);
    restartSlideshow();
  };
}

function attachPhotoEvents() {
  const lightbox      = document.getElementById('rpLightbox');
  const lightboxImg   = document.getElementById('rpLightboxImg');
  const lightboxTitle = document.getElementById('rpLightboxTitle');
  const closeBtn      = document.getElementById('rpLightboxClose');

  document.querySelectorAll('.photo-slide-card').forEach(card => {
    card.onclick = () => {
      stopSlideshow();
      lightboxImg.src        = card.dataset.full  || '';
      lightboxImg.alt        = card.dataset.title || '';
      lightboxTitle.textContent = card.dataset.title || '';
      lightbox.classList.remove('hidden');
      lightbox.setAttribute('aria-hidden','false');
      document.body.classList.add('lightbox-open');
    };
  });

  const close = () => {
    lightbox.classList.add('hidden');
    lightbox.setAttribute('aria-hidden','true');
    lightboxImg.src = '';
    document.body.classList.remove('lightbox-open');
    restartSlideshow();
  };
  if (closeBtn) closeBtn.onclick = close;
  if (lightbox) lightbox.onclick = e => { if (e.target===lightbox) close(); };
  document.onkeydown = e => { if (e.key==='Escape' && !lightbox.classList.contains('hidden')) close(); };
}
