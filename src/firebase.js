// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
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
let googleProvider;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  
  // Optional: Add any additional provider configuration
  googleProvider.setCustomParameters({
    prompt: 'select_account'  // Forces account selection even for one account
  });
  
  if (window.location.hostname === 'localhost') {
    console.log('Firebase initialized in development mode');
  } else {
    console.log('Firebase initialized in production mode');
  }
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Re-throw the error to be handled by the application
  throw error;
}

export { app, auth, db, googleProvider, GoogleAuthProvider };