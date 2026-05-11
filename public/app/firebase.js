import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { createUserWithEmailAndPassword, EmailAuthProvider, getAuth, onAuthStateChanged, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDownloadURL, getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfigResponse = await fetch('/api/firebase-config');
if (!firebaseConfigResponse.ok) {
    throw new Error('Firebase client config is missing.');
}

const firebaseConfig = await firebaseConfigResponse.json();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const LOGIN_AT_KEY = 'twinxcare_login_at';

export {
    addDoc, app, auth, collection, createUserWithEmailAndPassword, db, deleteDoc, doc, EmailAuthProvider, getDoc, getDocs, getDownloadURL, onAuthStateChanged, orderBy, query, reauthenticateWithCredential, ref, serverTimestamp, setDoc, signInWithEmailAndPassword, signOut, storage, updateDoc, updatePassword, uploadBytes, where
};

export async function markSessionStarted() {
    localStorage.setItem(LOGIN_AT_KEY, Date.now().toString());
}

export async function clearSessionStamp() {
    localStorage.removeItem(LOGIN_AT_KEY);
}

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
