import {
  loginThinkTank,
  getThinkTankPosts,
  createThinkTankPost,
  createThinkTankComment,
  likeThinkTankPost
} from "../api/thinkTankApi.js";

const POSTS_PAGE_SIZE = 10;

let currentMember = null;
let currentOffset = 0;
let allPostsLoaded = false;
let currentCategoryFilter = "all";
let currentOwnOnly = false;

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function properCase(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/(^|\s)\S/g, c => c.toUpperCase());
}

function memberName(member) {
  if (!member) return "Μέλος";

  const first = properCase(member.firstName || "");
  const last = properCase(member.lastName || "");

  return `${first} ${last}`.trim() || member.memberName || "Μέλος";
}

function memberInitials(member) {
  if (!member) return "Μ";

  const first = member.firstName?.trim()?.[0] || "";
  const last = member.lastName?.trim()?.[0] || "";

  return `${first}${last}`.toUpperCase() || "Μ";
}

function memberAvatar(member, avatarClass = "thinktank-avatar-48") {
  const photo = String(member?.photoLink || "").trim();
  const initials = memberInitials(member);
  const safeAvatarClass = escapeHtml(avatarClass);

  if (photo) {
    return `
      <img
        class="post-avatar-image ${safeAvatarClass}"
        src="${escapeHtml(photo)}"
        alt="${escapeHtml(memberName(member))}"
        onerror="this.outerHTML='<div class=&quot;post-avatar ${safeAvatarClass}&quot;>${escapeHtml(initials)}</div>'"
      >
    `;
  }

  return `<div class="post-avatar ${safeAvatarClass}">${escapeHtml(initials)}</div>`;
}

function formatDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("el-GR");
}

export async function render() {
  return `
    <style>
      .thinktank-post-body {
        position: relative;
      }

      .thinktank-post-body.collapsed .thinktank-post-text {
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
      }

      .thinktank-post-body.expanded .thinktank-post-text {
        max-height: none;
        display: block;
        -webkit-line-clamp: unset;
      }

      .thinktank-toggle-text {
        display: none;
        margin-top: 4px;
        background: none;
        border: none;
        padding: 0;
        color: var(--accent-color, #1a73e8);
        cursor: pointer;
        font-size: 0.9em;
        float: right;
      }

      .thinktank-toggle-text.visible {
        display: inline-block;
      }
    </style>

    <div class="profs-header">
      <div class="profs-eyebrow">MEMBERS ONLY</div>

      <h1>Δεξαμενή <em>Σκέψεων</em></h1>

      <p>
        Η σελίδα αυτή είναι διαθέσιμη μόνο σε εξουσιοδοτημένα μέλη
        των αποφοίτων του 1976.
      </p>
    </div>

    <main class="thinktank-main">

      <section class="thinktank-login" id="thinktankLoginBox">
        <article class="thinktank-card">
          <div class="section-tag">ΠΡΟΣΒΑΣΗ ΜΕΛΟΥΣ</div>

          <h2>Είσοδος στη Δεξαμενή Σκέψεων</h2>

          <p>
            Πληκτρολογήστε τον προσωπικό κωδικό που σας έχει δοθεί
            από τον διαχειριστή.
          </p>

          <input
            id="thinktankPassword"
            type="password"
            class="thinktank-input"
            placeholder="Κωδικός πρόσβασης"
          >

          <button id="thinktankLoginBtn" class="btn-primary thinktank-button">
            Είσοδος
          </button>

          <p id="thinktankLoginMessage" class="thinktank-message"></p>
        </article>
      </section>

      <section class="thinktank-private hidden" id="thinktankPrivateArea">

        <article class="thinktank-card">
          <div class="section-tag">ΚΑΛΩΣ ΗΡΘΑΤΕ</div>

          <h2 id="thinktankWelcome">Δεξαμενή Σκέψεων</h2>

          <p>
            Μπορείτε να γράψετε νέα ανάρτηση, να κάνετε σχόλια
            και να δηλώσετε ότι σας αρέσει μια δημοσίευση.
          </p>

          <button id="thinktankLogoutBtn" class="btn-outline">
            Αποσύνδεση
          </button>
        </article>

        <article class="thinktank-card">
          <div class="section-tag">ΝΕΑ ΑΝΑΡΤΗΣΗ</div>

          <h2>Υποβολή σκέψης</h2>

          <select id="postCategory" class="thinktank-input">
            <option value="thought">Σκέψη</option>
            <option value="memory">Ανάμνηση</option>
            <option value="news">Νέα μέλους</option>
            <option value="career">Πανεπιστήμιο & επάγγελμα</option>
          </select>

          <textarea
            id="postBody"
            class="thinktank-textarea"
            placeholder="Γράψτε το κείμενό σας..."
          ></textarea>

          <button id="submitPostBtn" class="btn-primary thinktank-button">
            Υποβολή για έγκριση
          </button>

          <p id="postMessage" class="thinktank-message"></p>
        </article>

        <article class="thinktank-card">
          <div class="section-tag">ΑΝΑΡΤΗΣΕΙΣ</div>
          <h2>Εγκεκριμένες αναρτήσεις</h2>

          <div class="thinktank-filters" style="display:flex; gap:12px; flex-wrap:wrap; align-items:center; margin-bottom:16px;">
            <select id="categoryFilter" class="thinktank-input" style="width:auto;">
              <option value="all">Όλες οι κατηγορίες</option>
              <option value="thought">Σκέψη</option>
              <option value="memory">Ανάμνηση</option>
              <option value="news">Νέα μέλους</option>
              <option value="career">Πανεπιστήμιο &amp; επάγγελμα</option>
            </select>

            <label style="display:flex; align-items:center; gap:6px;">
              <input type="checkbox" id="ownOnlyFilter">
              Μόνο οι δικές μου αναρτήσεις
            </label>
          </div>

          <div id="postsList">
            <p>Φόρτωση αναρτήσεων...</p>
          </div>

          <div id="loadMoreWrap" style="margin-top:24px; display:none;">
            <button id="loadMorePostsBtn" class="btn-outline">
              Φόρτωση παλαιότερων αναρτήσεων
            </button>
          </div>
        </article>

      </section>

    </main>
  `;
}

export async function afterRender() {
  const savedMember = sessionStorage.getItem("thinktankMember");

  if (savedMember) {
    try {
      currentMember = JSON.parse(savedMember);
      openPrivateArea();
      await resetAndLoadPosts();
    } catch {
      sessionStorage.removeItem("thinktankMember");
      currentMember = null;
    }
  }

  const loginBtn = document.getElementById("thinktankLoginBtn");
  const passwordInput = document.getElementById("thinktankPassword");
  const loginMessage = document.getElementById("thinktankLoginMessage");

  loginBtn?.addEventListener("click", async () => {
    const password = passwordInput.value.trim();

    if (!password) {
      loginMessage.textContent = "Παρακαλώ πληκτρολογήστε κωδικό.";
      return;
    }

    loginMessage.textContent = "Έλεγχος κωδικού...";

    try {
      const member = await loginThinkTank(password);

      if (!member) {
        loginMessage.textContent = "Λάθος κωδικός ή μη ενεργό μέλος.";
        return;
      }

      currentMember = member;

      sessionStorage.setItem(
        "thinktankMember",
        JSON.stringify(currentMember)
      );

      openPrivateArea();
      await resetAndLoadPosts();

    } catch (err) {
      console.error("ThinkTank login error:", err);

      loginMessage.textContent =
        "Λάθος κωδικός ή μη ενεργό μέλος.";
    }
  });

  document.getElementById("submitPostBtn")?.addEventListener("click", async () => {
    const postMessage = document.getElementById("postMessage");
    const category = document.getElementById("postCategory").value;
    const body = document.getElementById("postBody").value.trim();

    if (!currentMember) {
      postMessage.textContent = "Πρέπει πρώτα να γίνει είσοδος.";
      return;
    }

    if (!body) {
      postMessage.textContent = "Η ανάρτηση δεν μπορεί να είναι κενή.";
      return;
    }

    postMessage.textContent = "Αποθήκευση...";

    try {
      await createThinkTankPost({
        memberId: currentMember.memberId,
        category,
        body
      });

      document.getElementById("postBody").value = "";

      postMessage.textContent =
        "Η ανάρτηση υποβλήθηκε και αναμένει έγκριση.";

      await resetAndLoadPosts();

    } catch (err) {
      console.error("ThinkTank post error:", err);

      postMessage.textContent =
        err?.message || "Αποτυχία αποθήκευσης.";
    }
  });

  document.getElementById("loadMorePostsBtn")?.addEventListener("click", async () => {
    await loadApprovedPosts(false);
  });

  document.getElementById("categoryFilter")?.addEventListener("change", async event => {
    currentCategoryFilter = event.target.value;
    await resetAndLoadPosts();
  });

  document.getElementById("ownOnlyFilter")?.addEventListener("change", async event => {
    currentOwnOnly = event.target.checked;
    await resetAndLoadPosts();
  });

  document.getElementById("thinktankLogoutBtn")?.addEventListener("click", () => {
    sessionStorage.removeItem("thinktankMember");

    currentMember = null;
    currentOffset = 0;
    allPostsLoaded = false;
    currentCategoryFilter = "all";
    currentOwnOnly = false;

    document.getElementById("thinktankPrivateArea")?.classList.add("hidden");
    document.getElementById("thinktankLoginBox")?.classList.remove("hidden");

    const passwordInput = document.getElementById("thinktankPassword");
    const loginMessage = document.getElementById("thinktankLoginMessage");

    if (passwordInput) passwordInput.value = "";
    if (loginMessage) loginMessage.textContent = "";
  });
}

function openPrivateArea() {
  document.getElementById("thinktankLoginBox")?.classList.add("hidden");
  document.getElementById("thinktankPrivateArea")?.classList.remove("hidden");

  const welcome = document.getElementById("thinktankWelcome");

  if (welcome && currentMember) {
    welcome.textContent = `Καλώς ήρθες, ${currentMember.memberName || memberName(currentMember)}`;
  }
}

async function resetAndLoadPosts() {
  currentOffset = 0;
  allPostsLoaded = false;

  const postsList = document.getElementById("postsList");

  if (postsList) {
    postsList.innerHTML = "";
  }

  await loadApprovedPosts(true);
}

async function loadApprovedPosts(isFirstLoad = false) {
  const postsList = document.getElementById("postsList");
  const loadMoreWrap = document.getElementById("loadMoreWrap");

  if (!postsList || allPostsLoaded) return;

  if (isFirstLoad) {
    postsList.innerHTML = `<p>Φόρτωση αναρτήσεων...</p>`;
  }

  try {
    const posts = await getThinkTankPosts({
      offset: currentOffset,
      limit: POSTS_PAGE_SIZE,
      category: currentCategoryFilter,
      memberId: currentOwnOnly && currentMember ? currentMember.memberId : null
    });

    if (!posts || posts.length === 0) {
      if (currentOffset === 0) {
        postsList.innerHTML = `<p>Δεν υπάρχουν ακόμη εγκεκριμένες αναρτήσεις.</p>`;
      }

      allPostsLoaded = true;

      if (loadMoreWrap) {
        loadMoreWrap.style.display = "none";
      }

      return;
    }

    if (isFirstLoad) {
      postsList.innerHTML = "";
    }

    postsList.insertAdjacentHTML(
      "beforeend",
      posts.map(post => renderPost(post)).join("")
    );

    currentOffset += posts.length;

    if (posts.length < POSTS_PAGE_SIZE) {
      allPostsLoaded = true;

      if (loadMoreWrap) {
        loadMoreWrap.style.display = "none";
      }
    } else {
      if (loadMoreWrap) {
        loadMoreWrap.style.display = "block";
      }
    }

    attachPostEvents();

  } catch (err) {
    console.error("ThinkTank posts loading error:", err);
    postsList.innerHTML = `<p>Αποτυχία φόρτωσης αναρτήσεων.</p>`;
  }
}

function renderPost(post) {
  const postMember = {
    firstName: post.firstName,
    lastName: post.lastName,
    photoLink: post.photoLink
  };

  const comments = Array.isArray(post.comments) ? post.comments : [];
  const likesCount = Number(post.likesCount || 0);

  return `
    <article class="thinktank-post" data-post-id="${post.id}">
      <div class="post-header thinktank-post-header">
        ${memberAvatar(postMember, "thinktank-avatar-48")}

        <div>
          <h3>${escapeHtml(memberName(postMember))}</h3>
          <span>${formatDate(post.createdAt)} · ${escapeHtml(post.category || "thought")}</span>
        </div>
      </div>

      <div class="thinktank-post-body collapsed">
        <p class="thinktank-post-text">${escapeHtml(post.body)}</p>
        <button class="thinktank-toggle-text" type="button" data-state="collapsed">
          περισσότερα...
        </button>
      </div>

      <div class="post-actions">
        <button class="thinktank-action like-btn" data-post-id="${post.id}">
          ❤️ Μου αρέσει (${likesCount})
        </button>

        <span>💬 Σχόλια (${comments.length})</span>
      </div>

      <div class="thinktank-comments">
        ${comments.map(comment => {
          const commentMember = {
            firstName: comment.firstName,
            lastName: comment.lastName,
            photoLink: comment.photoLink
          };

          return `
            <div class="thinktank-comment">
              <div class="post-header comment-header thinktank-comment-header">
                ${memberAvatar(commentMember, "thinktank-avatar-34")}

                <div>
                  <strong>${escapeHtml(memberName(commentMember))}</strong>
                  <span>${formatDate(comment.createdAt)}</span>
                </div>
              </div>

              <p>${escapeHtml(comment.commentText)}</p>
            </div>
          `;
        }).join("")}
      </div>

      <div class="thinktank-comment-form">
        <input
          class="thinktank-input comment-input"
          data-post-id="${post.id}"
          placeholder="Γράψτε σχόλιο..."
        >

        <button class="btn-outline comment-btn" data-post-id="${post.id}">
          Υποβολή σχολίου
        </button>
      </div>
    </article>
  `;
}

function attachPostEvents() {
  document.querySelectorAll(".thinktank-post-body").forEach(wrap => {
    const text = wrap.querySelector(".thinktank-post-text");
    const button = wrap.querySelector(".thinktank-toggle-text");

    if (!text || !button) return;

    if (text.scrollHeight > text.clientHeight + 1) {
      button.classList.add("visible");
    }
  });

  document.querySelectorAll(".thinktank-toggle-text").forEach(button => {
    if (button.dataset.bound === "true") return;

    button.dataset.bound = "true";

    button.addEventListener("click", () => {
      const wrap = button.closest(".thinktank-post-body");
      const expanded = wrap.classList.toggle("expanded");

      wrap.classList.toggle("collapsed", !expanded);

      button.textContent = expanded
        ? "λιγότερα..."
        : "περισσότερα...";
    });
  });

  document.querySelectorAll(".like-btn").forEach(button => {
    if (button.dataset.bound === "true") return;

    button.dataset.bound = "true";

    button.addEventListener("click", async () => {
      const postId = Number(button.dataset.postId);
      await likePost(postId);
    });
  });

  document.querySelectorAll(".comment-btn").forEach(button => {
    if (button.dataset.bound === "true") return;

    button.dataset.bound = "true";

    button.addEventListener("click", async () => {
      const postId = Number(button.dataset.postId);

      const input = document.querySelector(
        `.comment-input[data-post-id="${postId}"]`
      );

      if (!input) return;

      const text = input.value.trim();

      if (!text) return;

      await addComment(postId, text);

      input.value = "";
    });
  });
}

async function likePost(postId) {
  if (!currentMember) return;

  try {
    await likeThinkTankPost({
      postId,
      memberId: currentMember.memberId
    });

    await resetAndLoadPosts();

  } catch (err) {
    console.error("ThinkTank like error:", err);
    alert("Έχετε ήδη δηλώσει ότι σας αρέσει αυτή η ανάρτηση.");
  }
}

async function addComment(postId, commentText) {
  if (!currentMember) return;

  try {
    await createThinkTankComment({
      postId,
      memberId: currentMember.memberId,
      commentText
    });

    alert("Το σχόλιο υποβλήθηκε και αναμένει έγκριση.");

  } catch (err) {
    console.error("ThinkTank comment error:", err);
    alert("Αποτυχία αποθήκευσης σχολίου.");
  }
}