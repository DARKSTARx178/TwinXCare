import * as Notifications from 'expo-notifications';

export const sendPushNotification = async (expoPushToken: string, title: string, body: string, data: any = {}) => {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
    };

    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });
        const result = await response.json();
        console.log('🚀 Expo Push Result:', result);
    } catch (error) {
        console.error('❌ Error sending Expo Push:', error);
    }
};

export const sendLocalNotification = async (title: string, body: string, data: any = {}) => {
    // Explicitly set handler to ensure it shows up in foreground
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });

    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
            },
            trigger: null, // Send immediately
        });
        console.log('✅ Local Notification scheduled:', title);
    } catch (error) {
        console.error('❌ Local Notification failed:', error);
    }
};
