import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD-V6hfGyOETDNxJf8Stb9DujbxQTIM76c",
  authDomain: "web-requerimientos.firebaseapp.com",
  projectId: "web-requerimientos",
  storageBucket: "web-requerimientos.firebasestorage.app",
  messagingSenderId: "707688130249",
  appId: "1:707688130249:web:c46b6252c46083b6e9cf18",
  measurementId: "G-TV2C27SXD3"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
