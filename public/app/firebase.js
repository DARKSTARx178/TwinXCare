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
    const placeholder = 'https://images.unsplash.com/photo-1576091160550-217359f49f4c?auto=format&fit=crop&q=80&w=400';
    if (!link || typeof link !== 'string') {
        console.warn('convertGoogleDriveLink: empty or non-string input', link);
        return placeholder;
    }

    const trimmed = link.trim();
    console.log('convertGoogleDriveLink input:', trimmed);

    // If it's already an absolute URL or data URI, return it (special-case Drive links)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
        // Handle common Google Drive share formats and convert to a viewable link
        if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
            const idMatch = trimmed.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{10,})/);
            if (idMatch && idMatch[1]) {
                const id = idMatch[1];
                const result = `https://drive.google.com/uc?export=view&id=${id}`;
                console.log('convertGoogleDriveLink output (drive):', result);
                return result;
            }
        }
        console.log('convertGoogleDriveLink output (as-is):', trimmed);
        return trimmed;
    }

    // If the stored value is just an ID-like string, build a Drive view URL
    const idOnly = link.match(/^([a-zA-Z0-9_-]{10,})$/);
    if (idOnly && idOnly[1]) {
        const result = `https://drive.google.com/uc?export=view&id=${idOnly[1]}`;
        console.log('convertGoogleDriveLink output (idOnly):', result);
        return result;
    }

    console.warn('convertGoogleDriveLink: fallback to placeholder for', link);
    return placeholder;
}
