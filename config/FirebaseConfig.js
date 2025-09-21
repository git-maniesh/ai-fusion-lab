// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "ai-fusion-lab-c3cd9.firebaseapp.com",
  projectId: "ai-fusion-lab-c3cd9",
  storageBucket: "ai-fusion-lab-c3cd9.firebasestorage.app",
  messagingSenderId: "1000993570837",
  appId: "1:1000993570837:web:b5d84ffa27dad177604e1c",
  measurementId: "G-YP9JJM7EW7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
