import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeContext, ThemeProvider } from '@/contexts/ThemeContext';
import { db } from '@/firebase/firebase';
import { APP_VERSION } from '@/utils/appversion';
import { Slot } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Button, Linking, StatusBar, StyleSheet, Text, View } from 'react-native';

function RootLayoutContent() {
  const { theme } = useContext(ThemeContext);
  const [checking, setChecking] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const docRef = doc(db, 'version', 'verProd');
        const snap = await getDoc(docRef);
        if (!mounted) return;
        if (snap.exists()) {
          const data = snap.data();
          // Prefer a `version` field, otherwise pick the first key (handles cases where the version is stored as a key)
          let remote: string | undefined = undefined;
          if (typeof data.version === 'string') remote = data.version;
          else {
            const keys = Object.keys(data || {});
            if (keys.length > 0) {
              // If key itself looks like a semver (e.g. '1.1.8'), use that; else check values
              if (/^\d+\.\d+\.\d+/.test(keys[0])) remote = keys[0];
              else if (typeof data[keys[0]] === 'string') remote = data[keys[0]] as string;
            }
          }

          if (remote) {
            setRemoteVersion(remote);
            if (remote !== APP_VERSION) {
              setBlocked(true);
            }
          }
        }
      } catch (e) {
        // On error, do not block — allow app to run
        console.warn('Version check failed', e);
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  
  if (checking) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}> 
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.text, marginTop: 12 }}>Checking app version...</Text>
      </View>
    );
  }

  if (blocked) {
    const playStoreUrl = `https://play.google.com/store/apps/details?id=com.darkstarx178.TwinXCare`;
    return (
      <View style={[styles.center, { backgroundColor: theme.background, padding: 24 }]}> 
        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Update required</Text>
        <Text style={{ color: theme.text, textAlign: 'center', marginBottom: 20 }}>
          {`Your app version (${APP_VERSION}) is out of date. Latest version is ${remoteVersion}. Please update to continue.`}
        </Text>
        <Button title="Update on Google Play" onPress={() => Linking.openURL(playStoreUrl)} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={theme.background === '#ffffff' ? 'dark-content' : 'light-content'} backgroundColor={theme.background} />
      <Slot />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default function RootLayout() {
  return (
    <AccessibilityProvider>
      <LanguageProvider>
        <ThemeProvider>
          <RootLayoutContent />
        </ThemeProvider>
      </LanguageProvider>
    </AccessibilityProvider>
  );
}
