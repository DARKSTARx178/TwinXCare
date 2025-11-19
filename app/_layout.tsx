import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeContext, ThemeProvider } from '@/contexts/ThemeContext';
import { Slot } from 'expo-router';
import { useContext } from 'react';
import { StatusBar } from 'react-native';

function RootLayoutContent() {
  const { theme } = useContext(ThemeContext);
  
  return (
    <>
      <StatusBar barStyle={theme.background === '#ffffff' ? 'dark-content' : 'light-content'} backgroundColor={theme.background} />
      <Slot />
    </>
  );
}

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
