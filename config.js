// ============================================================
//  config.js — All configurable values for the app
//  Fill in each placeholder before deploying.
// ============================================================

const CONFIG = {

  // ----------------------------------------------------------
  // FIREBASE PROJECT CONFIGURATION
  // Get these values from:
  //   Firebase Console → Project Settings → Your apps → Web app
  // ----------------------------------------------------------
  firebase: {
    apiKey:            "AIzaSyDdHMCVsD7lh9CYr43mNbSfu7orHniZOrE",
    authDomain:        "gpppppsssdddd.firebaseapp.com",
    projectId:         "gpppppsssdddd",
    storageBucket:     "gpppppsssdddd.firebasestorage.app",
    messagingSenderId: "52626638861",
    appId:             "1:52626638861:web:55ee14deb06159fab2ed44"
  },

  // ----------------------------------------------------------
  // ADMIN GOOGLE ACCOUNT EMAIL
  // The single Google account that can access the admin panel.
  // Must match the email address of the Google account exactly.
  // ----------------------------------------------------------
  adminEmail: "YOUR_ADMIN_EMAIL@gmail.com",

  // ----------------------------------------------------------
  // YOUTUBE REDIRECT URL
  // Normal users are redirected here after a successful import.
  // Example: "https://www.youtube.com/@YourChannel"
  // ----------------------------------------------------------
  youtubeUrl: "https://www.youtube.com/@YOUR_CHANNEL"

};

// Freeze so it can't be mutated at runtime
Object.freeze(CONFIG);
Object.freeze(CONFIG.firebase);
