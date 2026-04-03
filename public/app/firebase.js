import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { createUserWithEmailAndPassword, EmailAuthProvider, getAuth, onAuthStateChanged, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDownloadURL, getStorage, ref, uploadBytes, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

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
const storage = getStorage(app);

export {
    addDoc, app, auth, collection, createUserWithEmailAndPassword, db, doc, EmailAuthProvider, getDoc, getDocs, getDownloadURL, onAuthStateChanged, orderBy, query, reauthenticateWithCredential, ref, serverTimestamp, setDoc, signInWithEmailAndPassword, signOut, storage, updateDoc, updatePassword, uploadBytes, uploadBytesResumable, where
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

    // Quick accept data URIs and clearly direct URLs
    if (trimmed.startsWith('data:')) return trimmed;

    // Normalize scheme-less urls (e.g., //example.com/path)
    const maybeUrl = trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;

    // If it's an absolute URL, try to parse and handle known Google formats
    try {
        const u = new URL(maybeUrl);
        const host = u.hostname || '';

        // Drive / Docs links: try to extract file id
        if (host.includes('drive.google.com') || host.includes('docs.google.com')) {
            // Common patterns: /file/d/<id>/..., ?id=<id>
            let id = null;
            const pathMatch = u.pathname.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
            if (pathMatch && pathMatch[1]) id = pathMatch[1];
            if (!id) id = u.searchParams.get('id');

            // Also handle query-like uc?id= or /uc?export=download&id=...
            if (!id && u.pathname.includes('/uc')) {
                id = u.searchParams.get('id');
            }

            if (id) {
                const result = `https://drive.google.com/uc?export=view&id=${id}`;
                console.log('convertGoogleDriveLink output (drive):', result);
                return result;
            }
        }

        // If it's already a googleusercontent direct image, return as-is
        if (host.includes('googleusercontent.com') || host.includes('ggpht.com') || host.includes('gstatic.com')) {
            console.log('convertGoogleDriveLink output (direct-host):', maybeUrl);
            return maybeUrl;
        }

        // If it looks like a normal http(s) image URL, return it
        if (u.protocol === 'http:' || u.protocol === 'https:') {
            console.log('convertGoogleDriveLink output (as-is):', maybeUrl);
            return maybeUrl;
        }
    } catch (e) {
        // If URL parsing failed, fall through to regex heuristics
        console.warn('convertGoogleDriveLink: URL parse failed, falling back to heuristics', e);
    }

    // Heuristic: extract id from common drive patterns even if parsing failed
    const idMatch = trimmed.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{10,})/);
    if (idMatch && idMatch[1]) {
        const id = idMatch[1];
        const result = `https://drive.google.com/uc?export=view&id=${id}`;
        console.log('convertGoogleDriveLink output (regex-drive):', result);
        return result;
    }

    // If the stored value is just an ID-like string, build a Drive view URL
    const idOnly = trimmed.match(/^([a-zA-Z0-9_-]{10,})$/);
    if (idOnly && idOnly[1]) {
        const result = `https://drive.google.com/uc?export=view&id=${idOnly[1]}`;
        console.log('convertGoogleDriveLink output (idOnly):', result);
        return result;
    }

    console.warn('convertGoogleDriveLink: fallback to placeholder for', link);
    return placeholder;
}
