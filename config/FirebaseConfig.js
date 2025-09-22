


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "ai-fusion-lab-7160e.firebaseapp.com",
  projectId: "ai-fusion-lab-7160e",
  storageBucket: "ai-fusion-lab-7160e.firebasestorage.app",
  messagingSenderId: "928432981170",
  appId: "1:928432981170:web:c722bc820a2c3aaef4f5ab",
  measurementId: "G-9R8M7R1N71"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app)

