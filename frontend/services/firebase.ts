
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- INSTRUCTION: REPLACE WITH YOUR FIREBASE KEYS ---
// 1. Go to console.firebase.google.com
// 2. Click "Add App" -> Web (</> icon)
// 3. Copy the firebaseConfig object and paste it below.

const firebaseConfig = {
  // REPLACE THESE VALUES
  apiKey: "AIzaSyD-REPLACE_ME_WITH_REAL_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// We check if the key is the default placeholder. If so, we mock the firebase instance to prevent crashes.
const isConfigured = firebaseConfig.apiKey !== "AIzaSyD-REPLACE_ME_WITH_REAL_KEY";

let app;
let auth;
let db;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } catch (e) {
    console.error("Firebase initialization error:", e);
  }
} else {
  console.warn("Firebase not configured. Using mock mode. Update services/firebase.ts to connect to backend.");
}

export { auth, db, isConfigured };
