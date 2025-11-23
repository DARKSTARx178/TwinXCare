import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { default as React, useEffect, useState } from 'react';
import { Alert, Button, Platform, StyleSheet, Text, View } from 'react-native';

export default function NotifsDebug() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('checking');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (!mounted) return;
        setStatus(finalStatus || 'unknown');

        if (finalStatus === 'granted') {
          const tokenResp = await Notifications.getExpoPushTokenAsync();
          if (mounted) setToken(tokenResp.data);
        }
      } catch (e) {
        console.warn('Failed to get token', e);
        setStatus('error');
      }
    })();
    return () => { mounted = false; };
  }, []);

  const sendLocal = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Local test', body: 'This is a local notification.' },
        trigger: null
      });
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  };

  const sendExpoPush = async () => {
    if (!token) {
      Alert.alert('No token', 'No Expo push token available');
      return;
    }

    if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
      Alert.alert('Note', 'Expo Go on Android does not support receiving remote push notifications (SDK 53+). This request will still be sent but delivery will likely fail.');
    }

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: token,
          title: 'Expo push test',
          body: 'Hello from in-app tester',
          data: { from: 'in-app' }
        })
      });
      const json = await res.json();
      Alert.alert('Sent', JSON.stringify(json));
    } catch (e) {
      Alert.alert('Send failed', String(e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications tester</Text>
      <Text style={styles.row}><Text style={styles.key}>Platform:</Text> {Platform.OS}</Text>
      <Text style={styles.row}><Text style={styles.key}>App ownership:</Text> {Constants.appOwnership || 'unknown'}</Text>
      <Text style={styles.row}><Text style={styles.key}>Permissions:</Text> {status}</Text>
      <Text style={styles.row}><Text style={styles.key}>Expo token:</Text> {token ?? '—'}</Text>

      <View style={{ marginTop: 16 }}>
        <Button title="Trigger local notification" onPress={sendLocal} />
      </View>

      <View style={{ marginTop: 12 }}>
        <Button title="Send push via Expo API" onPress={sendExpoPush} />
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={styles.note}>Notes: Local notifications work in Expo Go. Remote push on Android requires a development client or standalone build (SDK 53+).</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  row: { marginBottom: 6 },
  key: { fontWeight: '700' },
  note: { color: '#666' }
});

// Notifications setup moved to `app/notifs/notifs-setup.tsx`.
// This route file only exports the debug UI component.
