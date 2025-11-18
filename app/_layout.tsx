import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <AccessibilityProvider>
      <LanguageProvider>
        <ThemeProvider>
          <Slot />
        </ThemeProvider>
      </LanguageProvider>
    </AccessibilityProvider>
  );
}
