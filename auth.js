/* ============================================================
   auth.js — Firebase Authentication + Google OAuth
   ============================================================ */

import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let _auth = null;

/**
 * Initialize Firebase Auth.
 * @param {import("firebase/app").FirebaseApp} app
 */
export function initAuth(app) {
  _auth = getAuth(app);
  return _auth;
}

export function getFirebaseAuth() {
  return _auth;
}

/**
 * Sign in with Google popup, requesting the contacts.readonly scope
 * so we can call the People API with the resulting access token.
 *
 * @returns {Promise<{user: object, accessToken: string}>}
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  // Minimum scope for Google People API contacts read
  provider.addScope("https://www.googleapis.com/auth/contacts.readonly");

  // Force account chooser every time so the user sees the consent
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(_auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  return {
    user: result.user,
    accessToken: credential.accessToken
  };
}

/**
 * Sign out the current user.
 */
export async function signOutUser() {
  await signOut(_auth);
}

/**
 * Listen to auth state changes.
 * @param {(user: object|null) => void} callback
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(_auth, callback);
}
