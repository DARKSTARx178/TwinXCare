import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBjT87EfeSWgU2GEWW2i21_PtqlKAljbmY",
    authDomain: "twinxcare.firebaseapp.com",
    projectId: "twinxcare",
    storageBucket: "twinxcare.firebasestorage.app",
    messagingSenderId: "46184664555",
    appId: "1:46184664555:web:0ecfc3d0d8579eb0d31dae"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);