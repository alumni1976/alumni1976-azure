import {
  loginThinkTank,
  getThinkTankPosts,
  createThinkTankPost,
  createThinkTankComment,
  likeThinkTankPost,
  updateOwnPost,
  deleteOwnPost,
  updateOwnComment,
  deleteOwnComment
} from "../api/thinkTankApi.js";

import {
  getText,
  formatText
} from "../services/textService.js";

const POSTS_PAGE_SIZE = 10;

let currentMember = null;
let currentPassword = null;
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
  const fallback = getText("thinktank.memberFallback", "Μέλος");

  if (!member) return fallback;

  const first = properCase(member.firstName || "");
  const last = properCase(member.lastName || "");

  return `${first} ${last}`.trim() || member.memberName || fallback;
}

function memberInitials(member) {
  const fallback = getText("thinktank.memberInitialFallback", "Μ");

  if (!member) return fallback;

  const first = member.firstName?.trim()?.[0] || "";
  const last = member.lastName?.trim()?.[0] || "";

  return `${first}${last}`.toUpperCase() || fallback;
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
      <div class="profs-eyebrow">${getText("thinktank.membersOnly", "MEMBERS ONLY")}</div>

      <h1>
        ${getText("thinktank.pageTitleStart", "Δεξαμενή")}
        <em>${getText("thinktank.pageTitleEmphasis", "Σκέψεων")}</em>
      </h1>

      <p>${getText(
        "thinktank.pageDescription",
        "Η σελίδα αυτή είναι διαθέσιμη μόνο σε εξουσιοδοτημένα μέλη των αποφοίτων του 1976."
      )}</p>
    </div>

    <main class="thinktank-main">

      <section class="thinktank-login" id="thinktankLoginBox">
        <article class="thinktank-card">
          <div class="section-tag">${getText("thinktank.memberAccessTag", "ΠΡΟΣΒΑΣΗ ΜΕΛΟΥΣ")}</div>

          <h2>${getText("thinktank.loginTitle", "Είσοδος στη Δεξαμενή Σκέψεων")}</h2>

          <p>${getText(
            "thinktank.loginDescription",
            "Πληκτρολογήστε τον προσωπικό κωδικό που σας έχει δοθεί από τον διαχειριστή."
          )}</p>

          <input
            id="thinktankPassword"
            type="password"
            class="thinktank-input"
            placeholder="${getText("thinktank.passwordPlaceholder", "Κωδικός πρόσβασης")}"
          >

          <button id="thinktankLoginBtn" class="btn-primary thinktank-button">
            ${getText("thinktank.loginButton", "Είσοδος")}
          </button>

          <p id="thinktankLoginMessage" class="thinktank-message"></p>
        </article>
      </section>

      <section class="thinktank-private hidden" id="thinktankPrivateArea">

        <article class="thinktank-card">
          <div class="section-tag">${getText("thinktank.welcomeTag", "ΚΑΛΩΣ ΗΡΘΑΤΕ")}</div>

          <h2 id="thinktankWelcome">${getText("thinktank.welcomeDefault", "Δεξαμενή Σκέψεων")}</h2>

          <p>${getText(
            "thinktank.privateAreaDescription",
            "Μπορείτε να γράψετε νέα ανάρτηση, να κάνετε σχόλια και να δηλώσετε ότι σας αρέσει μια δημοσίευση."
          )}</p>

          <button id="thinktankLogoutBtn" class="btn-outline">
            ${getText("thinktank.logoutButton", "Αποσύνδεση")}
          </button>
        </article>

        <article class="thinktank-card">
          <div class="section-tag">${getText("thinktank.newPostTag", "ΝΕΑ ΑΝΑΡΤΗΣΗ")}</div>

          <h2>${getText("thinktank.newPostTitle", "Υποβολή σκέψης")}</h2>

          <select id="postCategory" class="thinktank-input">
            <option value="thought">${getText("thinktank.categoryThought", "Σκέψη")}</option>
            <option value="memory">${getText("thinktank.categoryMemory", "Ανάμνηση")}</option>
            <option value="news">${getText("thinktank.categoryNews", "Νέα μέλους")}</option>
            <option value="career">${getText("thinktank.categoryCareer", "Πανεπιστήμιο & επάγγελμα")}</option>
          </select>

          <textarea
            id="postBody"
            class="thinktank-textarea"
            placeholder="${getText("thinktank.postPlaceholder", "Γράψτε το κείμενό σας...")}"
          ></textarea>

          <button id="submitPostBtn" class="btn-primary thinktank-button">
            ${getText("thinktank.submitPostButton", "Υποβολή για έγκριση")}
          </button>

          <p id="postMessage" class="thinktank-message"></p>
        </article>

        <article class="thinktank-card">
          <div class="section-tag">${getText("thinktank.postsTag", "ΑΝΑΡΤΗΣΕΙΣ")}</div>
          <h2>${getText("thinktank.approvedPostsTitle", "Εγκεκριμένες αναρτήσεις")}</h2>

          <div class="thinktank-filters" style="display:flex; gap:12px; flex-wrap:wrap; align-items:center; margin-bottom:16px;">
            <select id="categoryFilter" class="thinktank-input" style="width:auto;">
              <option value="all">${getText("thinktank.allCategories", "Όλες οι κατηγορίες")}</option>
              <option value="thought">${getText("thinktank.categoryThought", "Σκέψη")}</option>
              <option value="memory">${getText("thinktank.categoryMemory", "Ανάμνηση")}</option>
              <option value="news">${getText("thinktank.categoryNews", "Νέα μέλους")}</option>
              <option value="career">${getText("thinktank.categoryCareer", "Πανεπιστήμιο & επάγγελμα")}</option>
            </select>

            <label style="display:flex; align-items:center; gap:6px;">
              <input type="checkbox" id="ownOnlyFilter">
              ${getText("thinktank.ownPostsOnly", "Μόνο οι δικές μου αναρτήσεις")}
            </label>
          </div>

          <div id="postsList">
            <p>${getText("thinktank.loadingPosts", "Φόρτωση αναρτήσεων...")}</p>
          </div>

          <div id="loadMoreWrap" style="margin-top:24px; display:none;">
            <button id="loadMorePostsBtn" class="btn-outline">
              ${getText("thinktank.loadOlderPosts", "Φόρτωση παλαιότερων αναρτήσεων")}
            </button>
          </div>
        </article>

      </section>

    </main>
  `;
}

export async function afterRender() {
  const savedMember = sessionStorage.getItem("thinktankMember");
  const savedPassword = sessionStorage.getItem("thinktankPassword");

  if (savedMember) {
    try {
      currentMember = JSON.parse(savedMember);
      currentPassword = savedPassword || null;
      openPrivateArea();
      await resetAndLoadPosts();
    } catch {
      sessionStorage.removeItem("thinktankMember");
      sessionStorage.removeItem("thinktankPassword");
      currentMember = null;
      currentPassword = null;
    }
  }

  const loginBtn = document.getElementById("thinktankLoginBtn");
  const passwordInput = document.getElementById("thinktankPassword");
  const loginMessage = document.getElementById("thinktankLoginMessage");

  loginBtn?.addEventListener("click", async () => {
    const password = passwordInput.value.trim();

    if (!password) {
      loginMessage.textContent = getText(
        "thinktank.passwordRequired",
        "Παρακαλώ πληκτρολογήστε κωδικό."
      );
      return;
    }

    loginMessage.textContent = getText(
      "thinktank.checkingPassword",
      "Έλεγχος κωδικού..."
    );

    try {
      const member = await loginThinkTank(password);

      if (!member) {
        loginMessage.textContent = getText(
          "thinktank.invalidLogin",
          "Λάθος κωδικός ή μη ενεργό μέλος."
        );
        return;
      }

      currentMember = member;
      currentPassword = password;

      sessionStorage.setItem(
        "thinktankMember",
        JSON.stringify(currentMember)
      );

      sessionStorage.setItem("thinktankPassword", currentPassword);

      openPrivateArea();
      await resetAndLoadPosts();

    } catch (err) {
      console.error("ThinkTank login error:", err);

      loginMessage.textContent = getText(
        "thinktank.invalidLogin",
        "Λάθος κωδικός ή μη ενεργό μέλος."
      );
    }
  });

  document.getElementById("submitPostBtn")?.addEventListener("click", async () => {
    const submitButton = document.getElementById("submitPostBtn");
    const postMessage = document.getElementById("postMessage");
    const postBody = document.getElementById("postBody");
    const category = document.getElementById("postCategory").value;
    const body = postBody.value.trim();

    if (!currentMember) {
      postMessage.textContent = getText(
        "thinktank.loginRequired",
        "Πρέπει πρώτα να γίνει είσοδος."
      );
      return;
    }

    if (!body) {
      postMessage.textContent = getText(
        "thinktank.emptyPost",
        "Η ανάρτηση δεν μπορεί να είναι κενή."
      );
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = getText(
      "thinktank.aiEvaluatingPost",
      "Γίνεται αξιολόγηση από AI..."
    );

    postMessage.textContent = getText(
      "thinktank.aiEvaluationWait",
      "Παρακαλώ περιμένετε μέχρι να ολοκληρωθεί η αξιολόγηση."
    );

    try {
      const result = await createThinkTankPost({
        memberId: currentMember.id,
        category,
        body,
        imageUrl: null
      });

      postBody.value = "";

      const score = Number(result?.verdict?.score ?? 0);
      const sensitive = result?.verdict?.is_sensitive === true;

      if (score >= 8 && !sensitive) {
        postMessage.textContent = getText(
          "thinktank.postApproved",
          "Η ανάρτηση εγκρίθηκε από το AI και δημοσιεύτηκε."
        );

        await resetAndLoadPosts();
      } else if (score <= 3 || sensitive) {
        postMessage.textContent = getText(
          "thinktank.postRejected",
          "Η ανάρτηση απορρίφθηκε από το σύστημα αξιολόγησης και δεν δημοσιεύτηκε."
        );
      } else {
        postMessage.textContent = getText(
          "thinktank.postPending",
          "Η ανάρτηση καταχωρήθηκε και αναμένει έλεγχο από τον διαχειριστή."
        );
      }

    } catch (err) {
      console.error("ThinkTank post error:", err);

      postMessage.textContent =
        err?.message ||
        getText("thinktank.postSaveError", "Αποτυχία αποθήκευσης.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = getText(
        "thinktank.submitPostButton",
        "Υποβολή για έγκριση"
      );
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
    sessionStorage.removeItem("thinktankPassword");

    currentMember = null;
    currentPassword = null;
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

  const vocativeName =
    `${currentMember.vocativeFirstName || currentMember.firstName || ""} ${
      currentMember.vocativeLastName || currentMember.lastName || ""
    }`.trim();

  welcome.textContent = `Καλώς ήρθες, ${vocativeName}`;
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
    postsList.innerHTML = `<p>${getText(
      "thinktank.loadingPosts",
      "Φόρτωση αναρτήσεων..."
    )}</p>`;
  }

  try {
    const posts = await getThinkTankPosts({
      offset: currentOffset,
      limit: POSTS_PAGE_SIZE,
      category: currentCategoryFilter,
      memberId: currentOwnOnly && currentMember ? currentMember.id : null
    });

    if (!posts || posts.length === 0) {
      if (currentOffset === 0) {
        postsList.innerHTML = `<p>${getText(
          "thinktank.noApprovedPosts",
          "Δεν υπάρχουν ακόμη εγκεκριμένες αναρτήσεις."
        )}</p>`;
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
    } else if (loadMoreWrap) {
      loadMoreWrap.style.display = "block";
    }

    attachPostEvents();

  } catch (err) {
    console.error("ThinkTank posts loading error:", err);

    postsList.innerHTML = `<p>${getText(
      "thinktank.postsLoadError",
      "Αποτυχία φόρτωσης αναρτήσεων."
    )}</p>`;
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
  const isOwnPost = currentMember && Number(post.memberId) === Number(currentMember.id);

  return `
    <article class="thinktank-post" data-post-id="${post.id}">
      <div class="post-header thinktank-post-header">
        ${memberAvatar(postMember, "thinktank-avatar-48")}

        <div>
          <h3>${escapeHtml(memberName(postMember))}</h3>
          <span>${formatDate(post.createdAt)} · ${escapeHtml(post.category || "thought")}</span>
        </div>

        ${isOwnPost ? `
          <div class="thinktank-own-controls">
            <button class="btn-link edit-post-btn" type="button" data-post-id="${post.id}">
              ${getText("thinktank.editButton", "Επεξεργασία")}
            </button>
            <button class="btn-link delete-post-btn" type="button" data-post-id="${post.id}">
              ${getText("thinktank.deleteButton", "Διαγραφή")}
            </button>
          </div>
        ` : ""}
      </div>

      <div class="thinktank-post-body collapsed" data-post-id="${post.id}">
        <p class="thinktank-post-text">${escapeHtml(post.body)}</p>
        <button class="thinktank-toggle-text" type="button" data-state="collapsed">
          ${getText("thinktank.more", "περισσότερα...")}
        </button>
      </div>

      ${isOwnPost ? `
        <div class="thinktank-edit-form hidden" data-post-id="${post.id}">
          <textarea class="thinktank-input edit-post-textarea" data-post-id="${post.id}">${escapeHtml(post.body)}</textarea>
          <div class="thinktank-edit-actions">
            <button class="btn-outline save-post-btn" type="button" data-post-id="${post.id}">
              ${getText("thinktank.saveButton", "Αποθήκευση")}
            </button>
            <button class="btn-link cancel-edit-post-btn" type="button" data-post-id="${post.id}">
              ${getText("thinktank.cancelButton", "Ακύρωση")}
            </button>
          </div>
        </div>
      ` : ""}

      <div class="post-actions">
        <button class="thinktank-action like-btn" data-post-id="${post.id}">
          ${formatText(
            "thinktank.likeButton",
            { count: likesCount },
            `❤️ Μου αρέσει (${likesCount})`
          )}
        </button>

        <span>${formatText(
          "thinktank.commentsCount",
          { count: comments.length },
          `💬 Σχόλια (${comments.length})`
        )}</span>
      </div>

      ${comments.length ? `
        <div class="thinktank-comments">
          ${comments.map(comment => renderComment(comment)).join("")}
        </div>
      ` : ""}

      <div class="thinktank-comment-form">
        <input
          class="thinktank-input comment-input"
          data-post-id="${post.id}"
          placeholder="${getText("thinktank.commentPlaceholder", "Γράψτε σχόλιο...")}"
        >

        <button class="btn-outline comment-btn" data-post-id="${post.id}">
          ${getText("thinktank.submitCommentButton", "Υποβολή σχολίου")}
        </button>
      </div>
    </article>
  `;
}

function renderComment(comment) {
  const commentMember = {
    firstName: comment.firstName,
    lastName: comment.lastName,
    photoLink: comment.photoLink
  };

  const isOwnComment = currentMember && Number(comment.memberId) === Number(currentMember.id);

  return `
    <div class="thinktank-comment" data-comment-id="${comment.id}">
      <div class="post-header comment-header thinktank-comment-header">
        ${memberAvatar(commentMember, "thinktank-avatar-34")}

        <div>
          <strong>${escapeHtml(memberName(commentMember))}</strong>
          <span>${formatDate(comment.createdAt)}</span>
        </div>

        ${isOwnComment ? `
          <div class="thinktank-own-controls">
            <button class="btn-link edit-comment-btn" type="button" data-comment-id="${comment.id}">
              ${getText("thinktank.editButton", "Επεξεργασία")}
            </button>
            <button class="btn-link delete-comment-btn" type="button" data-comment-id="${comment.id}">
              ${getText("thinktank.deleteButton", "Διαγραφή")}
            </button>
          </div>
        ` : ""}
      </div>

      <p class="thinktank-comment-text" data-comment-id="${comment.id}">${escapeHtml(comment.commentText)}</p>

      ${isOwnComment ? `
        <div class="thinktank-edit-form hidden" data-comment-id="${comment.id}">
          <textarea class="thinktank-input edit-comment-textarea" data-comment-id="${comment.id}">${escapeHtml(comment.commentText)}</textarea>
          <div class="thinktank-edit-actions">
            <button class="btn-outline save-comment-btn" type="button" data-comment-id="${comment.id}">
              ${getText("thinktank.saveButton", "Αποθήκευση")}
            </button>
            <button class="btn-link cancel-edit-comment-btn" type="button" data-comment-id="${comment.id}">
              ${getText("thinktank.cancelButton", "Ακύρωση")}
            </button>
          </div>
        </div>
      ` : ""}
    </div>
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
        ? getText("thinktank.less", "λιγότερα...")
        : getText("thinktank.more", "περισσότερα...");
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

      button.disabled = true;
      button.textContent = getText(
        "thinktank.aiEvaluatingComment",
        "Αξιολόγηση AI..."
      );

      try {
        const submitted = await addComment(postId, text);

        if (submitted) {
          input.value = "";
        }
      } finally {
        button.disabled = false;
        button.textContent = getText(
          "thinktank.submitCommentButton",
          "Υποβολή σχολίου"
        );
      }
    });
  });

  document.querySelectorAll(".edit-post-btn").forEach(button => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", () => {
      const postId = button.dataset.postId;
      toggleEditForm("post", postId, true);
    });
  });

  document.querySelectorAll(".cancel-edit-post-btn").forEach(button => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", () => {
      const postId = button.dataset.postId;
      toggleEditForm("post", postId, false);
    });
  });

  document.querySelectorAll(".save-post-btn").forEach(button => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", async () => {
      const postId = Number(button.dataset.postId);
      await saveEditedPost(postId, button);
    });
  });

  document.querySelectorAll(".delete-post-btn").forEach(button => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", async () => {
      const postId = Number(button.dataset.postId);
      await deletePostHandler(postId, button);
    });
  });

  document.querySelectorAll(".edit-comment-btn").forEach(button => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", () => {
      const commentId = button.dataset.commentId;
      toggleEditForm("comment", commentId, true);
    });
  });

  document.querySelectorAll(".cancel-edit-comment-btn").forEach(button => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", () => {
      const commentId = button.dataset.commentId;
      toggleEditForm("comment", commentId, false);
    });
  });

  document.querySelectorAll(".save-comment-btn").forEach(button => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", async () => {
      const commentId = Number(button.dataset.commentId);
      await saveEditedComment(commentId, button);
    });
  });

  document.querySelectorAll(".delete-comment-btn").forEach(button => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", async () => {
      const commentId = Number(button.dataset.commentId);
      await deleteCommentHandler(commentId, button);
    });
  });
}

function toggleEditForm(kind, id, show) {
  const selector = kind === "post"
    ? `.thinktank-edit-form[data-post-id="${id}"]`
    : `.thinktank-edit-form[data-comment-id="${id}"]`;

  const form = document.querySelector(selector);
  if (!form) return;

  form.classList.toggle("hidden", !show);

  const bodySelector = kind === "post"
    ? `.thinktank-post-body[data-post-id="${id}"]`
    : `.thinktank-comment-text[data-comment-id="${id}"]`;

  const body = document.querySelector(bodySelector);
  if (body) {
    body.classList.toggle("hidden", show);
  }
}

async function saveEditedPost(postId, button) {
  if (!currentMember || !currentPassword) return;

  const textarea = document.querySelector(
    `.edit-post-textarea[data-post-id="${postId}"]`
  );

  if (!textarea) return;

  const body = textarea.value.trim();

  if (!body) {
    alert(getText("thinktank.emptyPostError", "Η ανάρτηση δεν μπορεί να είναι κενή."));
    return;
  }

  button.disabled = true;
  button.textContent = getText("thinktank.aiEvaluatingComment", "Αξιολόγηση AI...");

  try {
    const updated = await updateOwnPost({
      postId,
      memberId: currentMember.id,
      password: currentPassword,
      body
    });

    if (updated?.isApproved) {
      alert(getText(
        "thinktank.postApproved",
        "Η ανάρτηση ενημερώθηκε και είναι ορατή."
      ));
    } else {
      alert(getText(
        "thinktank.postPendingReview",
        "Η ανάρτηση ενημερώθηκε και αναμένει εκ νέου έλεγχο από τον διαχειριστή."
      ));
    }

    await resetAndLoadPosts();

  } catch (err) {
    console.error("ThinkTank post edit error:", err);

    alert(
      err?.message ||
      getText("thinktank.postSaveError", "Αποτυχία ενημέρωσης ανάρτησης.")
    );

  } finally {
    button.disabled = false;
    button.textContent = getText("thinktank.saveButton", "Αποθήκευση");
  }
}

async function deletePostHandler(postId, button) {
  if (!currentMember || !currentPassword) return;

  const confirmed = confirm(getText(
    "thinktank.confirmDeletePost",
    "Θέλετε σίγουρα να διαγράψετε αυτή την ανάρτηση; Η ενέργεια δεν αναιρείται."
  ));

  if (!confirmed) return;

  button.disabled = true;

  try {
    await deleteOwnPost({
      postId,
      memberId: currentMember.id,
      password: currentPassword
    });

    await resetAndLoadPosts();

  } catch (err) {
    console.error("ThinkTank post delete error:", err);

    alert(
      err?.message ||
      getText("thinktank.postDeleteError", "Αποτυχία διαγραφής ανάρτησης.")
    );

    button.disabled = false;
  }
}

async function saveEditedComment(commentId, button) {
  if (!currentMember || !currentPassword) return;

  const textarea = document.querySelector(
    `.edit-comment-textarea[data-comment-id="${commentId}"]`
  );

  if (!textarea) return;

  const commentText = textarea.value.trim();

  if (!commentText) {
    alert(getText("thinktank.emptyCommentError", "Το σχόλιο δεν μπορεί να είναι κενό."));
    return;
  }

  button.disabled = true;
  button.textContent = getText("thinktank.aiEvaluatingComment", "Αξιολόγηση AI...");

  try {
    const updated = await updateOwnComment({
      commentId,
      memberId: currentMember.id,
      password: currentPassword,
      commentText
    });

    if (updated?.isApproved) {
      alert(getText(
        "thinktank.commentApprovedEdit",
        "Το σχόλιο ενημερώθηκε και είναι ορατό."
      ));
    } else {
      alert(getText(
        "thinktank.commentPendingReview",
        "Το σχόλιο ενημερώθηκε και αναμένει εκ νέου έλεγχο από τον διαχειριστή."
      ));
    }

    await resetAndLoadPosts();

  } catch (err) {
    console.error("ThinkTank comment edit error:", err);

    alert(
      err?.message ||
      getText("thinktank.commentEditSaveError", "Αποτυχία ενημέρωσης σχολίου.")
    );

  } finally {
    button.disabled = false;
    button.textContent = getText("thinktank.saveButton", "Αποθήκευση");
  }
}

async function deleteCommentHandler(commentId, button) {
  if (!currentMember || !currentPassword) return;

  const confirmed = confirm(getText(
    "thinktank.confirmDeleteComment",
    "Θέλετε σίγουρα να διαγράψετε αυτό το σχόλιο; Η ενέργεια δεν αναιρείται."
  ));

  if (!confirmed) return;

  button.disabled = true;

  try {
    await deleteOwnComment({
      commentId,
      memberId: currentMember.id,
      password: currentPassword
    });

    await resetAndLoadPosts();

  } catch (err) {
    console.error("ThinkTank comment delete error:", err);

    alert(
      err?.message ||
      getText("thinktank.commentDeleteError", "Αποτυχία διαγραφής σχολίου.")
    );

    button.disabled = false;
  }
}

async function likePost(postId) {
  if (!currentMember) return;

  try {
    await likeThinkTankPost({
      postId,
      memberId: currentMember.id
    });

    await resetAndLoadPosts();

  } catch (err) {
    console.error("ThinkTank like error:", err);

    alert(getText(
      "thinktank.alreadyLiked",
      "Έχετε ήδη δηλώσει ότι σας αρέσει αυτή η ανάρτηση."
    ));
  }
}

async function addComment(postId, commentText) {
  if (!currentMember) return false;

  try {
    const result = await createThinkTankComment({
      postId,
      memberId: currentMember.id,
      commentText
    });

    const score = Number(result?.verdict?.score ?? 0);
    const sensitive = result?.verdict?.is_sensitive === true;

    if (score >= 8 && !sensitive) {
      alert(getText(
        "thinktank.commentApproved",
        "Το σχόλιο εγκρίθηκε από το AI και δημοσιεύτηκε."
      ));

      await resetAndLoadPosts();
    } else if (score <= 3 || sensitive) {
      alert(getText(
        "thinktank.commentRejected",
        "Το σχόλιο απορρίφθηκε από το σύστημα αξιολόγησης και δεν δημοσιεύτηκε."
      ));
    } else {
      alert(getText(
        "thinktank.commentPending",
        "Το σχόλιο καταχωρήθηκε και αναμένει έλεγχο από τον διαχειριστή."
      ));
    }

    return true;

  } catch (err) {
    console.error("ThinkTank comment error:", err);

    alert(
      err?.message ||
      getText(
        "thinktank.commentSaveError",
        "Αποτυχία αποθήκευσης σχολίου."
      )
    );

    return false;
  }
}
