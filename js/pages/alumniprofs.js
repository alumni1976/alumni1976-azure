import { getText } from "../services/textService.js";

const SUPABASE_URL = "https://hpnrlshfxxcyujrxegka.supabase.co";

const SUPABASE_KEY =
  document.getElementById("supabase-db")?.dataset?.apikey;

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initialsFromName(name = "") {
  const cleanName = String(name)
    .replace(
      new RegExp(
        `^${getText(
          "alumniprofs.professorFallbackName",
          "Καθηγητής"
        )}\\s+`,
        "i"
      ),
      ""
    )
    .trim();

  const parts = cleanName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts
    .map(part => part[0] || "")
    .join("")
    .toUpperCase() || getText(
      "alumniprofs.initialFallback",
      "Κ"
    );
}

async function fetchProfessorPhotos() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/prof_photos?select=id,url_cloud,name,birth_death_years,is_deceased,sort_order&order=sort_order.asc,id.asc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw data || new Error(
      getText(
        "alumniprofs.fetchError",
        "Failed to load professor photos"
      )
    );
  }

  return data || [];
}

export async function render() {
  return `
    <div class="profs-header">
      <div class="profs-header-orb"></div>

      <div class="profs-eyebrow">
        ${getText(
          "alumniprofs.eyebrow",
          "Σχολή Ηλεκτρολόγων Μηχανικών · Πανεπιστήμιο Πατρών"
        )}
      </div>

      <h1>
        ${getText("alumniprofs.pageTitleStart", "Οι")}
        <em>${getText("alumniprofs.pageTitleEmphasis", "Καθηγητές")}</em>
        ${getText("alumniprofs.pageTitleEnd", "μας")}
      </h1>

      <p>
        ${getText(
          "alumniprofs.pageDescription",
          "Η ποιότητα των σπουδών μας είναι το αποτέλεσμα της εξαιρετικής καθοδήγησης των καθηγητών μας."
        )}
      </p>
    </div>

    <main class="profs-main">
      <div id="profsMessage" class="photos-message">
        ${getText(
          "alumniprofs.loading",
          "Φόρτωση καθηγητών..."
        )}
      </div>

      <div id="profsContent" class="hidden">
        <div class="prof-section" id="livingProfsSection">
          <div class="prof-section-label">
            ${getText("alumniprofs.livingLabel", "Εν Ζωή")}
          </div>

          <h2 class="prof-section-title">
            ${getText(
              "alumniprofs.livingTitle",
              "Οι Δάσκαλοί μας εν ζωή"
            )}
          </h2>

          <p class="prof-section-subtitle">
            ${getText(
              "alumniprofs.livingSubtitle",
              "Με βαθιά εκτίμηση και ευγνωμοσύνη τιμούμε τους καθηγητές που μας καθοδήγησαν."
            )}
          </p>

          <div class="prof-grid" id="livingProfsGrid"></div>
        </div>

        <div class="prof-section-divider" id="profsDivider"></div>

        <div class="prof-section" id="memorialProfsSection">
          <div class="prof-section-label">
            ${getText("alumniprofs.memorialLabel", "Μνήμη")}
          </div>

          <h2 class="prof-section-title">
            ${getText(
              "alumniprofs.memorialTitle",
              "Οι Δάσκαλοί μας που έχουν φύγει"
            )}
          </h2>

          <p class="prof-section-subtitle">
            ${getText(
              "alumniprofs.memorialSubtitle",
              "Πάντα θα σας θυμόμαστε…"
            )}
          </p>

          <div class="prof-grid" id="memorialProfsGrid"></div>
        </div>
      </div>
    </main>
  `;
}

export async function afterRender() {
  const message = document.getElementById("profsMessage");
  const content = document.getElementById("profsContent");
  const livingSection = document.getElementById("livingProfsSection");
  const memorialSection = document.getElementById("memorialProfsSection");
  const divider = document.getElementById("profsDivider");
  const livingGrid = document.getElementById("livingProfsGrid");
  const memorialGrid = document.getElementById("memorialProfsGrid");

  if (!SUPABASE_KEY) {
    message.textContent = getText(
      "alumniprofs.missingApiKey",
      "Δεν βρέθηκε Supabase API key."
    );
    return;
  }

  try {
    const profs = await fetchProfessorPhotos();

    if (!profs.length) {
      message.textContent = getText(
        "alumniprofs.noProfessors",
        "Δεν υπάρχουν ακόμη διαθέσιμα στοιχεία καθηγητών."
      );
      return;
    }

    const livingProfs = profs.filter(
      prof => prof.is_deceased !== true
    );

    const memorialProfs = profs.filter(
      prof => prof.is_deceased === true
    );

    livingGrid.innerHTML = livingProfs
      .map(prof => profCard(prof))
      .join("");

    memorialGrid.innerHTML = memorialProfs
      .map(prof => profCard(prof))
      .join("");

    if (!livingProfs.length) {
      livingSection.classList.add("hidden");
    }

    if (!memorialProfs.length) {
      memorialSection.classList.add("hidden");
    }

    if (!livingProfs.length || !memorialProfs.length) {
      divider.classList.add("hidden");
    }

    message.textContent = "";
    content.classList.remove("hidden");

  } catch (err) {
    console.error(err);

    message.textContent = getText(
      "alumniprofs.loadError",
      "Αποτυχία φόρτωσης στοιχείων καθηγητών."
    );
  }
}

function profCard(prof) {
  const image = String(prof.url_cloud || "").trim();

  const name = String(
    prof.name ||
    getText(
      "alumniprofs.professorFallbackName",
      "Καθηγητής"
    )
  ).trim();

  const years = String(
    prof.birth_death_years || ""
  ).trim();

  const isDeceased = prof.is_deceased === true;
  const initials = initialsFromName(name);

  const yearsText = isDeceased && years
    ? `✝ ${years}`
    : years;

  return `
    <div class="prof-card ${isDeceased ? "memorial" : ""}">
      <div class="prof-photo-wrap">
        ${
          image
            ? `
              <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(name)}"
                loading="lazy"
                onerror="this.parentElement.innerHTML='<div class=prof-initials>${escapeHtml(initials)}</div>'"
              />
            `
            : `<div class="prof-initials">${escapeHtml(initials)}</div>`
        }
      </div>

      <div class="prof-name">${escapeHtml(name)}</div>

      ${
        yearsText
          ? `<div class="prof-dates">${escapeHtml(yearsText)}</div>`
          : ""
      }
    </div>
  `;
}
