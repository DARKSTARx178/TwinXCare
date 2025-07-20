import { Slot } from 'expo-router';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function RootLayout() {
  return (
    <AccessibilityProvider>
      <LanguageProvider>
        <Slot />
      </LanguageProvider>
    </AccessibilityProvider>
  );
}
