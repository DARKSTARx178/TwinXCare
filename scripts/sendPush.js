// Simple script to send a push using expo-server-sdk
// Usage: node scripts/sendPush.js <EXPO_PUSH_TOKEN> "Title" "Body"

const { Expo } = require('expo-server-sdk');

if (process.argv.length < 5) {
  console.error('Usage: node sendPush.js <EXPO_PUSH_TOKEN> "Title" "Body"');
  process.exit(1);
}

const token = process.argv[2];
const title = process.argv[3];
const body = process.argv[4];

const expo = new Expo();

async function send() {
  if (!Expo.isExpoPushToken(token)) {
    console.error('Invalid Expo push token:', token);
    return;
  }

  const messages = [
    {
      to: token,
      sound: 'default',
      title,
      body,
      data: { test: true }
    }
  ];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      console.log('Tickets:', tickets);
    }
  } catch (e) {
    console.error('Send error', e);
  }
}

send();
