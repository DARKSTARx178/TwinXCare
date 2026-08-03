import TourOverlay from '@/components/TourOverlay';
import { AccessibilityProvider, useAccessibility } from '@/contexts/AccessibilityContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeContext, ThemeProvider } from '@/contexts/ThemeContext';
import { TourProvider } from '@/contexts/TourContext';
import { auth, db } from '@/firebase/firebase';
import { APP_VERSION } from '@/utils/appversion';
import { getFontSizeValue } from '@/utils/fontSizes';
import { enforceSessionExpiry } from '@/utils/sessionSecurity';
import { Slot } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { Button, Linking, StatusBar, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NotificationsSetup from './notifs/notifs-setup';
import SplashScreen from './SplashScreen';

function RootLayoutContent() {
  const { theme } = useContext(ThemeContext);
  const { fontSize } = useAccessibility();
  const textSize = getFontSizeValue(fontSize);
  const [checking, setChecking] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const docRef = doc(db, 'version', 'verProd');
        const snap = await getDoc(docRef);
        if (!mounted) return;
        if (snap.exists()) {
          const data = snap.data();
          let remote: string | undefined = undefined;
          if (typeof data.version === 'string') remote = data.version;
          else {
            const keys = Object.keys(data || {});
            if (keys.length > 0) {
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
        console.warn('Version check failed', e);
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        await enforceSessionExpiry(user);
      } catch (error) {
        console.warn('Session expiry check failed', error);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!checking) {
      const t = setTimeout(() => setShowSplash(false), 750);
      return () => clearTimeout(t);
    }
  }, [checking]);

  if (checking) {
    return <SplashScreen message="Checking version" />;
  }

  if (blocked) {
    const playStoreUrl = `https://play.google.com/store/apps/details?id=com.darkstarx178.TwinXCare`;
    return (
      <View style={[styles.center, { backgroundColor: theme.background, padding: 24 }]}>
        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: Math.max(18, textSize - 2), marginBottom: 12 }}>Update required</Text>
        <Text style={{ color: theme.text, textAlign: 'center', marginBottom: 20, fontSize: Math.max(14, textSize - 6) }}>
          {`Your app version (${APP_VERSION}) is out of date. Latest version is ${remoteVersion}. Please update to continue.`}
        </Text>
        <Button title="Update on Google Play" onPress={() => Linking.openURL(playStoreUrl)} />
      </View>
    );
  }

  if (showSplash) {
    return <SplashScreen message={"Done"} />;
  }

  return (
    <>
      <NotificationsSetup />
      <StatusBar barStyle={theme.background === '#ffffff' ? 'dark-content' : 'light-content'} backgroundColor={theme.background} />
      <Slot />
      <TourOverlay />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AccessibilityProvider>
        <LanguageProvider>
          <ThemeProvider>
            <TourProvider>
              <RootLayoutContent />
            </TourProvider>
          </ThemeProvider>
        </LanguageProvider>
      </AccessibilityProvider>
    </GestureHandlerRootView>
  );
}
