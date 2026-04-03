import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { createUserWithEmailAndPassword, EmailAuthProvider, getAuth, onAuthStateChanged, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, orderBy, query, serverTimestamp, setDoc, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
    addDoc, app, auth, collection, createUserWithEmailAndPassword, db, doc, EmailAuthProvider, getDoc, getDocs, onAuthStateChanged, orderBy, query, reauthenticateWithCredential, serverTimestamp, setDoc,
    signInWithEmailAndPassword, signOut, updatePassword, where
};

// Utility for formatting google drive links precisely like the native app
export function convertGoogleDriveLink(link) {
    if (!link || typeof link !== 'string') return 'https://images.unsplash.com/photo-1576091160550-217359f49f4c?auto=format&fit=crop&q=80&w=200';
    
    // Handle various Google Drive URL formats
    let fileId = null;
    
    // Format 1: https://drive.google.com/file/d/FILE_ID/view or /view?...
    const match1 = link.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (match1) fileId = match1[1];
    
    // Format 2: https://drive.google.com/open?id=FILE_ID
    if (!fileId) {
        const match2 = link.match(/[?&]id=([a-zA-Z0-9-_]+)/);
        if (match2) fileId = match2[1];
    }
    
    // Format 3: Direct /d/ format
    if (!fileId) {
        const match3 = link.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match3) fileId = match3[1];
    }
    
    if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    // If it's already a valid URL, return as-is
    if (link.startsWith('http://') || link.startsWith('https://')) {
        return link;
    }
    
    return 'https://images.unsplash.com/photo-1576091160550-217359f49f4c?auto=format&fit=crop&q=80&w=200';
}
