// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Optional: Add any additional provider configuration
googleProvider.setCustomParameters({
  prompt: 'select_account'  // Forces account selection even for one account
});

if (window.location.hostname === 'localhost') {
  console.log('Firebase initialized in development mode');
} else {
  console.log('Firebase initialized in production mode');
}

export { app, auth, db, googleProvider, GoogleAuthProvider };