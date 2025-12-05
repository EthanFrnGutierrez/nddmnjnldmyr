// firebase.js (modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
// importa otros productos solo si los usas (storage, database, etc.)

// ---- CONFIG: reemplaza estos valores por los que te da Firebase console si ves errores ----
const firebaseConfig = {
  apiKey: "AIzaSyD-V6hfGyOETDNxJf8Stb9DujbxQTIM76c",
  authDomain: "web-requerimientos.firebaseapp.com",
  projectId: "web-requerimientos",
  storageBucket: "web-requerimientos.firebasestorage.app",
  messagingSenderId: "707688130249",
  appId: "1:707688130249:web:c46b6252c46083b6e9cf18",
  measurementId: "G-TV2C27SXD3"
};

const app = initializeApp(firebaseConfig);
try {
  const analytics = getAnalytics(app);
} catch (e) {
  // analytics puede fallar en algunos entornos locales; no es crítico
  console.warn("Analytics no inicializado:", e.message);
}

export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("🔥 Firebase inicializado (modular).");
