// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAzKY7ZlEwFgUzNFwgod8av6Ng7icJEDhM",
  authDomain: "click-solve-win.firebaseapp.com",
  projectId: "click-solve-win",
  storageBucket: "click-solve-win.firebasestorage.app",
  messagingSenderId: "1081635843711",
  appId: "1:1081635843711:web:bbf6a39e982ca91528194a",
  measurementId: "G-LVQLG1T1VN"
};

// Initialize Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  if (window.location.hostname === 'localhost') {
    console.log('Firebase initialized in development mode');
  } else {
    console.log('Firebase initialized in production mode');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Handle the error appropriately for your app
  if (!app) {
    // Fallback or show error UI
    console.error('Failed to initialize Firebase');
  }
}

export { auth, db };