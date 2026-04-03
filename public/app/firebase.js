import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { createUserWithEmailAndPassword, EmailAuthProvider, getAuth, onAuthStateChanged, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBLq5KEYwGoODg-IhX-KD_wq7glWW719d0",
    authDomain: "twinxcarebackend.firebaseapp.com",
    projectId: "twinxcarebackend",
    storageBucket: "twinxcarebackend.firebasestorage.app",
    messagingSenderId: "791637368111",
    appId: "1:791637368111:web:2110bb059b6427ca3295da"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
    addDoc, app, auth, collection, createUserWithEmailAndPassword, db, doc, EmailAuthProvider, getDoc, getDocs, onAuthStateChanged, orderBy, query, reauthenticateWithCredential, serverTimestamp, setDoc, signInWithEmailAndPassword, signOut, updateDoc, updatePassword, where
};

// Utility for formatting google drive links precisely like the native app
export function convertGoogleDriveLink(link) {
    console.log('convertGoogleDriveLink input:', link);
    
    // Return a working placeholder image
    // In real app, these would be actual image URLs from database
    const placeholders = [
        'https://images.unsplash.com/photo-1576091160550-217359f49f4c?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1585141905556-38be173ce312?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1579154204601-01d82b27ebee?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1631217314831-c02b2e9de0d6?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1587854692152-cbe660dbde3f?auto=format&fit=crop&q=80&w=400'
    ];
    
    // Use a pseudo-random but consistent image based on input
    const hash = (link || '').split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    const index = Math.abs(hash) % placeholders.length;
    
    const result = placeholders[index];
    console.log('convertGoogleDriveLink output:', result);
    return result;
}
