/* ============================================================
   firestore.js — Cloud Firestore read/write operations
   ============================================================ */

import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let _db = null;

/**
 * Initialize Firestore.
 * @param {import("firebase/app").FirebaseApp} app
 */
export function initFirestore(app) {
  _db = getFirestore(app);
  return _db;
}

/**
 * Save a user's imported contacts to Firestore.
 *
 * Firestore path:  users/{uid}
 * Document fields: profile, contacts, importedAt
 *
 * Security: Firestore Rules enforce that only the authenticated
 * user with matching uid can write to this document.
 *
 * @param {string} uid      — Firebase Auth UID (used as document ID)
 * @param {object} profile  — { googleId, email, name, photoUrl }
 * @param {Array}  contacts — Array of parsed contact objects
 * @returns {Promise<void>}
 */
export async function saveUserContacts(uid, profile, contacts) {
  const path = `users/${uid}`;
  const userRef = doc(_db, "users", uid);

  try {
    await setDoc(userRef, {
      profile: {
        googleId: profile.googleId,
        email:    profile.email,
        name:     profile.name,
        photoUrl: profile.photoUrl || ""
      },
      contacts:    contacts,
      importedAt:  serverTimestamp(),
      contactCount: contacts.length
    });
  } catch (err) {
    console.error("Firestore saveUserContacts failed:", {
      code: err.code || "unknown",
      message: err.message || String(err),
      name: err.name || "Error",
      path: path
    });
    throw err;
  }
}

/**
 * Fetch all user records from Firestore.
 *
 * Security: Firestore Rules enforce that only the admin
 * (identified by their email token claim) can read ALL documents.
 * Normal users are blocked at the rules level.
 *
 * @returns {Promise<Array<{uid: string, profile: object, contacts: Array, importedAt: object, contactCount: number}>>}
 */
export async function fetchAllUsers() {
  const usersRef  = collection(_db, "users");
  const snapshot  = await getDocs(usersRef);
  const users     = [];

  snapshot.forEach((docSnap) => {
    users.push({
      uid: docSnap.id,
      ...docSnap.data()
    });
  });

  return users;
}
