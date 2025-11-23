import { auth, db } from '@/firebase/firebase';
import * as Notifications from 'expo-notifications';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function NotificationsSetup() {
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.warn('Notification permissions not granted');
          return;
        }

        const tokenResp = await Notifications.getExpoPushTokenAsync();
        const token = tokenResp.data;
        console.log('Expo push token:', token);

        const user = auth.currentUser;
        if (user && mounted) {
          try {
            await setDoc(doc(db, 'users', user.uid), { pushToken: token, pushPlatform: Platform.OS }, { merge: true });
          } catch (e) {
            console.warn('Failed to save push token to Firestore', e);
          }
        }
      } catch (e) {
        console.warn('Error setting up notifications', e);
      }
    })();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response', response);
    });

    return () => {
      mounted = false;
      try {
        if (notificationListener.current && typeof notificationListener.current.remove === 'function') notificationListener.current.remove();
      } catch (e) {
        console.warn('Failed to remove notification listener', e);
      }
      try {
        if (responseListener.current && typeof responseListener.current.remove === 'function') responseListener.current.remove();
      } catch (e) {
        console.warn('Failed to remove response listener', e);
      }
    };
  }, []);

  return null;
}
