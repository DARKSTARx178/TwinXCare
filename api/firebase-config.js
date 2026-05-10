export default function handler(req, res) {
    const config = {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };

    const missingKeys = Object.entries(config)
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missingKeys.length > 0) {
        return res.status(500).json({
            error: 'Firebase client config is missing.',
            missingKeys,
        });
    }

    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    return res.status(200).json(config);
}
