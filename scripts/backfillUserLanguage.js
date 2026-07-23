require('dotenv').config({ path: '.env.local' });

const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

function getServiceAccount() {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error('Firebase Admin credentials are not configured.');
  }

  return {
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert(getServiceAccount()),
  });
}

async function backfillUserLanguage() {
  const db = getFirestore(getAdminApp());
  const usersSnap = await db.collection('users').get();

  let batch = db.batch();
  let pendingWrites = 0;
  let updatedCount = 0;

  for (const userDoc of usersSnap.docs) {
    const language = userDoc.data()?.language;
    if (language === 'en' || language === 'zh') continue;

    batch.set(userDoc.ref, { language: 'en' }, { merge: true });
    pendingWrites += 1;
    updatedCount += 1;

    if (pendingWrites === 450) {
      await batch.commit();
      batch = db.batch();
      pendingWrites = 0;
    }
  }

  if (pendingWrites > 0) {
    await batch.commit();
  }

  console.log(`Backfilled language preference for ${updatedCount} user document(s).`);
}

backfillUserLanguage().catch((error) => {
  console.error('Failed to backfill user language preferences:', error);
  process.exit(1);
});
