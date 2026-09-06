/* ============================================================
   app.js — Main application controller
   Initializes Firebase, routes between screens, orchestrates
   the user flow and admin flow.
   ============================================================ */

import { initializeApp }     from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { initAuth, signInWithGoogle, signOutUser, onAuthChange } from "./auth.js";
import { initFirestore, saveUserContacts }  from "./firestore.js";
import { fetchContacts, ContactAccessDeniedError } from "./contacts.js";
import { initAdminPanel } from "./admin.js";

// ---- Bootstrap ----

const app = initializeApp(CONFIG.firebase);
initAuth(app);
initFirestore(app);

// ---- Screen helpers ----

const SCREENS = ["screen-signin", "screen-importing", "screen-result", "screen-admin"];

function showScreen(id) {
  SCREENS.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.toggle("active", s === id);
  });
}

// ---- Auth state listener ----

let _hasHandledSession = false; // prevent duplicate handling on token refresh

onAuthChange(async (user) => {
  if (!user) {
    // Signed out — show sign-in screen
    _hasHandledSession = false;
    showScreen("screen-signin");
    return;
  }

  // Prevent re-running the flow if auth token silently refreshes
  if (_hasHandledSession) return;
  _hasHandledSession = true;

  const email = user.email || "";

  if (email === CONFIG.adminEmail) {
    // ---- Admin path ----
    showScreen("screen-admin");
    await initAdminPanel();
  }
  // Note: normal user flow is triggered explicitly by the sign-in button,
  // not by onAuthChange, because we need the access token from the popup result.
});

// ---- Sign-in button ----

document.getElementById("google-signin-btn").addEventListener("click", async () => {
  hideSigninError();
  disableSigninBtn(true);

  try {
    const { user, accessToken } = await signInWithGoogle();

    // If admin, onAuthChange will route them — skip normal flow
    if (user.email === CONFIG.adminEmail) {
      disableSigninBtn(false);
      return;
    }

    // ---- Normal user flow ----
    showScreen("screen-importing");

    let contacts;
    try {
      contacts = await fetchContacts(accessToken);
    } catch (err) {
      if (err instanceof ContactAccessDeniedError) {
        showResultScreen(false, "Contact access was denied. Please sign in again and authorize contact access when prompted.");
      } else {
        showResultScreen(false, "We couldn't import your contacts. Please try again.");
      }
      disableSigninBtn(false);
      return;
    }

    // Save to Firestore
    try {
      const profile = {
        googleId: user.uid,
        email:    user.email   || "",
        name:     user.displayName || "",
        photoUrl: user.photoURL    || ""
      };
      await saveUserContacts(user.uid, profile, contacts);
    } catch (err) {
      console.error("Failed to save user contacts to Firestore:", {
        code: err.code || "unknown",
        message: err.message || String(err),
        name: err.name || "Error",
        path: `users/${user.uid}`
      });
      showResultScreen(false, "Your contacts were imported but couldn't be saved. Please try again.");
      disableSigninBtn(false);
      return;
    }

    // Success — show countdown and redirect
    showResultScreen(true, null, contacts.length);

  } catch (err) {
    // Popup closed by user or sign-in cancelled — not an error
    if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
      disableSigninBtn(false);
      return;
    }
    showSigninError("Sign-in failed. Please try again.");
    disableSigninBtn(false);
  }
});

// ---- Result screen ----

function showResultScreen(success, errorMessage = null, contactCount = 0) {
  showScreen("screen-result");

  const iconEl     = document.getElementById("result-icon");
  const titleEl    = document.getElementById("result-title");
  const subtitleEl = document.getElementById("result-subtitle");
  const actionsEl  = document.getElementById("result-actions");

  if (success) {
    iconEl.className   = "result-icon success";
    iconEl.textContent = "✓";
    titleEl.textContent    = "Contacts imported successfully!";
    subtitleEl.textContent = `${contactCount} contact${contactCount !== 1 ? "s" : ""} saved securely.`;

    // 3-second countdown then redirect
    startCountdown(3, CONFIG.youtubeUrl, actionsEl);

  } else {
    iconEl.className   = "result-icon error";
    iconEl.textContent = "!";
    titleEl.textContent    = "Import failed";
    subtitleEl.textContent = errorMessage || "We couldn't import your contacts. Please authorize contact access and try again.";

    actionsEl.innerHTML = `
      <button class="md-btn md-btn-filled" id="retry-btn">Try again</button>
    `;
    document.getElementById("retry-btn").addEventListener("click", () => {
      showScreen("screen-signin");
    });
  }
}

function startCountdown(seconds, url, container) {
  const countdownEl = document.createElement("div");
  countdownEl.className = "countdown-badge";
  countdownEl.textContent = `Redirecting in ${seconds}…`;
  container.prepend(countdownEl);

  const manualBtn = document.createElement("a");
  manualBtn.className = "md-btn md-btn-outlined";
  manualBtn.href = url;
  manualBtn.target = "_blank";
  manualBtn.rel = "noopener noreferrer";
  manualBtn.textContent = "Go now →";
  container.appendChild(manualBtn);

  let remaining = seconds - 1;
  const interval = setInterval(() => {
    if (remaining <= 0) {
      clearInterval(interval);
      window.location.href = url;
      return;
    }
    countdownEl.textContent = `Redirecting in ${remaining}…`;
    remaining--;
  }, 1000);
}

// ---- Sign-in UI helpers ----

function disableSigninBtn(disabled) {
  const btn = document.getElementById("google-signin-btn");
  if (!btn) return;
  btn.disabled = disabled;
  btn.style.opacity = disabled ? "0.6" : "1";
  btn.style.cursor  = disabled ? "wait" : "pointer";
}

function showSigninError(msg) {
  const el = document.getElementById("signin-error");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("visible");
}

function hideSigninError() {
  const el = document.getElementById("signin-error");
  if (el) el.classList.remove("visible");
}
