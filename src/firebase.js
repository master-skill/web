// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

export const auth = getAuth(app);
export const db = getFirestore(app);