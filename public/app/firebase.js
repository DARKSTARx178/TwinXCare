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
    if (!link || typeof link !== 'string') {
        console.warn('convertGoogleDriveLink: empty or non-string input', link);
        return 'https://images.unsplash.com/photo-1576091160550-217359f49f4c?auto=format&fit=crop&q=80&w=400';
    }
    
    console.log('convertGoogleDriveLink input:', link);
    
    // If it's already a full URL (not a Google Drive link), return as-is
    if (link.startsWith('http://') || link.startsWith('https://')) {
        // If it's a Google Drive link, convert it
        if (link.includes('drive.google.com')) {
            // Extract file ID from various Google Drive formats
            const fileIdMatch = link.match(/(?:\/d\/|id=)([a-zA-Z0-9-_]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
                const fileId = fileIdMatch[1];
                return `https://drive.google.com/uc?export=download&id=${fileId}`;
            }
        }
        console.log('convertGoogleDriveLink: returning URL as-is', link);
        return link;
    }
    
    console.warn('convertGoogleDriveLink: fallback to placeholder for', link);
    return 'https://images.unsplash.com/photo-1576091160550-217359f49f4c?auto=format&fit=crop&q=80&w=400';
}
