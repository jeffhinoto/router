// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: "qrcode-9f641.firebaseapp.com",
    projectId: "qrcode-9f641",
    storageBucket: "qrcode-9f641.appspot.com",
    messagingSenderId: "379065507409",
    appId: "1:379065507409:web:b5a81c006d79b9c4c6e270",
    measurementId: "G-MNC3SPN9B9"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
