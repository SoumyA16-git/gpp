/* ============================================================
   admin.js — Admin panel rendering and per-user JSON download
   ============================================================ */

import { fetchAllUsers } from "./firestore.js";
import { signOutUser }   from "./auth.js";

/**
 * Initialize the admin panel.
 * Fetches all user records and renders them into #screen-admin.
 */
export async function initAdminPanel() {
  attachSignOutHandler();

  const listEl    = document.getElementById("users-list");
  const totalEl   = document.getElementById("stat-total-users");
  const contactEl = document.getElementById("stat-total-contacts");
  const loadingEl = document.getElementById("admin-loading");

  try {
    const users = await fetchAllUsers();

    // Update stats
    const totalContacts = users.reduce((sum, u) => sum + (u.contactCount || 0), 0);
    totalEl.textContent   = users.length;
    contactEl.textContent = totalContacts;

    // Hide loading indicator
    loadingEl.style.display = "none";

    if (users.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>No contact imports yet.</p>
        </div>`;
      return;
    }

    // Sort by importedAt descending (newest first)
    users.sort((a, b) => {
      const ta = a.importedAt?.seconds || 0;
      const tb = b.importedAt?.seconds || 0;
      return tb - ta;
    });

    // Render each user card
    listEl.innerHTML = "";
    users.forEach((user, index) => {
      const card = buildUserCard(user, index);
      listEl.appendChild(card);
    });

  } catch (err) {
    loadingEl.innerHTML = `
      <p style="color: var(--md-error);">
        ⚠️ Failed to load data. Make sure you are signed in as admin and Firestore rules are deployed.<br/>
        <small>${err.message}</small>
      </p>`;
  }
}

// ---- Card Builder ----

function buildUserCard(user, index) {
  const profile      = user.profile || {};
  const contacts     = user.contacts || [];
  const importedAt   = formatTimestamp(user.importedAt);
  const initials     = getInitials(profile.name || profile.email || "?");
  const cardId       = `user-card-${index}`;
  const jsonViewerId = `json-viewer-${index}`;

  const card = document.createElement("div");
  card.className = "user-card";
  card.id = cardId;

  card.innerHTML = `
    <div class="user-card-header" role="button" tabindex="0"
         aria-expanded="false" aria-controls="body-${cardId}"
         onclick="toggleCard('${cardId}')">

      <div class="user-avatar" title="${escHtml(profile.name || "")}">
        ${profile.photoUrl
          ? `<img src="${escHtml(profile.photoUrl)}" alt="${escHtml(profile.name || "User")}" onerror="this.style.display='none'">`
          : initials}
      </div>

      <div class="user-info">
        <div class="user-name">${escHtml(profile.name || "—")}</div>
        <div class="user-email">${escHtml(profile.email || "—")}</div>
      </div>

      <div class="user-meta">
        <div class="meta-badge">
          <strong>${contacts.length}</strong>
          contacts
        </div>
        <div class="meta-badge">
          <strong style="font-size:13px;">${importedAt}</strong>
          imported at
        </div>
      </div>

      <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>

    <div class="user-card-body" id="body-${cardId}">
      <div class="json-toolbar">
        <button class="md-btn md-btn-outlined" id="download-btn-${index}"
                onclick="downloadUserJson('${escHtml(user.uid)}', '${escHtml(profile.email || user.uid)}',
                          '${jsonViewerId}')">
          ⬇ Download JSON
        </button>
      </div>
      <pre class="json-viewer" id="${jsonViewerId}">${syntaxHighlight(buildExportObject(user))}</pre>
      <div class="user-card-footer"></div>
    </div>
  `;

  return card;
}

// ---- Card Toggle ----

window.toggleCard = function(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;
  card.classList.toggle("expanded");
  const header = card.querySelector(".user-card-header");
  const expanded = card.classList.contains("expanded");
  header.setAttribute("aria-expanded", String(expanded));
};

// ---- Per-user JSON Download ----

window.downloadUserJson = function(uid, email, viewerId) {
  const preEl = document.getElementById(viewerId);
  if (!preEl) return;

  // Get the raw text (strip HTML tags the syntax highlighter added)
  const rawText = preEl.textContent;

  const blob     = new Blob([rawText], { type: "application/json" });
  const url      = URL.createObjectURL(blob);
  const anchor   = document.createElement("a");
  anchor.href    = url;
  anchor.download = `contacts_${sanitizeFilename(email || uid)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

// ---- Sign Out ----

function attachSignOutHandler() {
  const btn = document.getElementById("admin-signout-btn");
  if (btn) {
    btn.addEventListener("click", async () => {
      await signOutUser();
      // app.js onAuthChange will handle redirect back to sign-in
    });
  }
}

// ---- Helpers ----

/**
 * Build the export-ready JSON object for a user record.
 */
function buildExportObject(user) {
  return {
    user: {
      googleId: user.uid,
      email:    user.profile?.email    || "",
      name:     user.profile?.name     || "",
      photoUrl: user.profile?.photoUrl || ""
    },
    contacts:    user.contacts  || [],
    contactCount: user.contactCount || 0,
    importedAt:  user.importedAt
      ? new Date(user.importedAt.seconds * 1000).toISOString()
      : null
  };
}

function formatTimestamp(ts) {
  if (!ts?.seconds) return "—";
  return new Date(ts.seconds * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || "")
    .join("");
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeFilename(str) {
  return str.replace(/[^a-z0-9._-]/gi, "_").toLowerCase();
}

/**
 * Syntax-highlight a JSON object for the dark code viewer.
 */
function syntaxHighlight(obj) {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "json-num";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "json-key" : "json-str";
      } else if (/true|false/.test(match)) {
        cls = "json-bool";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return `<span class="${cls}">${escHtml(match)}</span>`;
    }
  );
}
