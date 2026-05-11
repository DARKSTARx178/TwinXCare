// firebase.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

function getAsyncStoragePersistence(storage) {
  return class AsyncStoragePersistence {
    static type = 'LOCAL';
    type = 'LOCAL';

    async _isAvailable() {
      try {
        await storage.setItem('__twinxcare_auth_storage_test__', '1');
        await storage.removeItem('__twinxcare_auth_storage_test__');
        return true;
      } catch {
        return false;
      }
    }

    _set(key, value) {
      return storage.setItem(key, JSON.stringify(value));
    }

    async _get(key) {
      const value = await storage.getItem(key);
      return value ? JSON.parse(value) : null;
    }

    _remove(key) {
      return storage.removeItem(key);
    }

    _addListener() { }
    _removeListener() { }
  };
}

// Initialize Firebase Authentication
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getAsyncStoragePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;

// Initialize Firestore
export const db = getFirestore(app);

export default app;
