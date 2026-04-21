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
        return '';
    }

    const trimmedLink = link.trim();
    const driveIdPattern = /^[a-zA-Z0-9_-]{20,}$/;

    if (driveIdPattern.test(trimmedLink) && !trimmedLink.startsWith('http')) {
        return `https://drive.google.com/thumbnail?id=${trimmedLink}&sz=w1200`;
    }

    const idMatch = trimmedLink.match(/(?:\/d\/|open\?id=|id=|\/uc\?export=(?:download|view)&id=)([a-zA-Z0-9_-]+)/);
    const resourceKeyMatch = trimmedLink.match(/[&?]resourcekey=([a-zA-Z0-9_-]+)/);

    if (idMatch && idMatch[1]) {
        const id = idMatch[1];
        const resourceKey = resourceKeyMatch && resourceKeyMatch[1] ? `&resourcekey=${resourceKeyMatch[1]}` : '';
        return `https://drive.google.com/thumbnail?id=${id}&sz=w1200${resourceKey}`;
    }

    if (trimmedLink.startsWith('http://') || trimmedLink.startsWith('https://')) {
        return trimmedLink;
    }

    return '';
}
