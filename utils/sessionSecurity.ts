import * as SecureStore from 'expo-secure-store';
import { signOut, User } from 'firebase/auth';
import { auth } from '@/firebase/firebase';

const LOGIN_AT_KEY = 'twinxcare_login_at';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export async function markSessionStarted() {
    await SecureStore.setItemAsync(LOGIN_AT_KEY, Date.now().toString());
}

export async function clearSessionStamp() {
    await SecureStore.deleteItemAsync(LOGIN_AT_KEY);
}

export async function enforceSessionExpiry(user: User | null) {
    if (!user) {
        await clearSessionStamp();
        return false;
    }

    const loginAtValue = await SecureStore.getItemAsync(LOGIN_AT_KEY);
    const loginAt = Number(loginAtValue || 0);

    if (!loginAt) {
        await markSessionStarted();
        return false;
    }

    if (Date.now() - loginAt > SESSION_MAX_AGE_MS) {
        await clearSessionStamp();
        await signOut(auth);
        return true;
    }

    return false;
}
