import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccount() {
    const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

    if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
        return {
            projectId: FIREBASE_PROJECT_ID,
            clientEmail: FIREBASE_CLIENT_EMAIL,
            privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };
    }

    const serviceAccountPath = path.join(process.cwd(), 'server-dep', 'serviceAccountKey.json');
    if (existsSync(serviceAccountPath)) {
        return JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    }

    throw new Error('Firebase Admin credentials are not configured.');
}

function getAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    return initializeApp({
        credential: cert(getServiceAccount()),
    });
}

function setCors(res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

export default async function handler(req, res) {
    setCors(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        const { targetUserId } = req.body || {};

        if (!token) {
            return res.status(401).json({ error: 'Missing admin token' });
        }

        if (!targetUserId || typeof targetUserId !== 'string') {
            return res.status(400).json({ error: 'Missing targetUserId' });
        }

        const app = getAdminApp();
        const adminAuth = getAuth(app);
        const adminDb = getFirestore(app);

        const decodedToken = await adminAuth.verifyIdToken(token);
        const adminUserId = decodedToken.uid;

        if (adminUserId === targetUserId) {
            return res.status(400).json({ error: 'You cannot delete your own account from this admin tool' });
        }

        const adminUserDoc = await adminDb.collection('users').doc(adminUserId).get();
        if (!adminUserDoc.exists || adminUserDoc.data()?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin privileges required' });
        }

        const targetUserDocRef = adminDb.collection('users').doc(targetUserId);
        const targetUserDoc = await targetUserDocRef.get();
        const targetUserData = targetUserDoc.exists ? targetUserDoc.data() : null;

        if (targetUserData?.role === 'admin') {
            return res.status(400).json({ error: 'Switch the user role to \"user\" before deleting an admin account' });
        }

        await adminAuth.deleteUser(targetUserId);
        await targetUserDocRef.delete();

        return res.status(200).json({
            success: true,
            deletedUserId: targetUserId,
            deletedEmail: targetUserData?.email || null,
        });
    } catch (error) {
        console.error('admin-delete-user error:', error);

        if (error?.code === 'auth/user-not-found') {
            return res.status(404).json({ error: 'Firebase Auth user not found' });
        }

        return res.status(500).json({ error: 'Failed to delete user from Firebase Auth and Firestore' });
    }
}
