import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { useTour } from '@/contexts/TourContext';
import { usePathname, useRouter } from 'expo-router';
import React, { useContext, useEffect, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TOUR_STEPS = [
  {
    key: 'home',
    title: 'Welcome to TwinXCare',
    description: 'Start by exploring equipment and services from the home screen. Tap the cards to jump in.',
    button: 'Next',
  },
  {
    key: 'explore',
    title: 'Book Equipment',
    description: 'Search equipment, filter stock, and reserve devices for your care team.',
    button: 'Next',
  },
  {
    key: 'services',
    title: 'Request an Escort',
    description: 'Find volunteer escorts and submit a transport request from the services tab.',
    button: 'Next',
  },
  {
    key: 'escort',
    title: 'Need Help Fast?',
    description: 'Create a request or offer availability in the Escort section and track your status here.',
    button: 'Finish',
  },
];

export default function TourOverlay() {
  const { theme } = useContext(ThemeContext);
  const { lang } = useLanguage();
  const { fontSize } = useAccessibility();
  const router = useRouter();
  const pathname = usePathname();
  const tour = useTour();
  const { tourActive, tourStep, tourRole, tourPromptMessage, nextStep, stopTour } = tour;

  const visibleSteps = useMemo(() => {
    return tourRole === 'admin' ? TOUR_STEPS.filter((step) => step.key !== 'escort') : TOUR_STEPS;
  }, [tourRole]);

  const stepCount = visibleSteps.length;
  const progress = tourStep >= 0 ? ((tourStep + 1) / stepCount) : 0;
  const progressLabel = tourStep === -1 ? 'Tour intro' : `Step ${tourStep + 1} of ${stepCount}`;
  const showStep = visibleSteps[tourStep] || visibleSteps[0];

  const handleNavigateTo = (path: string) => router.push(path as any);

  useEffect(() => {
    if (!tourActive || tourStep === -1) return;

    const routeMap: Record<string, string> = {
      home: '/index',
      explore: '/explore',
      services: '/services',
      escort: '/escorts/require-escort',
    };

    const currentStep = visibleSteps[tourStep];
    const targetRoute = routeMap[currentStep?.key || 'home'];

    if (targetRoute && pathname !== targetRoute) {
      router.push(targetRoute as any);
    }
  }, [tourActive, tourStep, pathname, router, visibleSteps]);

  if (!tourActive) {
    return null;
  }

  if (tourStep === -1) {
    return (
      <View style={[styles.overlay, { backgroundColor: theme.background + 'd0' }]}> 
        <View style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.title, { color: theme.text }]}>Welcome to TwinXCare</Text>
          <Text style={[styles.description, { color: theme.textDim, marginBottom: 20 }]}>Create an account to save your progress, or continue as guest. If you already have an account, sign in instead.</Text>
          {tourPromptMessage ? (
            <Text style={[styles.noteText, { color: theme.primary, marginBottom: 20 }]}>{tourPromptMessage}</Text>
          ) : null}
          <View style={styles.authButtonsRow}>
            <TouchableOpacity onPress={() => nextStep()} style={[styles.primaryButton, { backgroundColor: theme.primary, flex: 1, marginRight: 8 }]}> 
              <Text style={[styles.primaryText, { color: theme.surface }]}>Continue as Guest</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNavigateTo('/login')} style={[styles.secondaryButton, { borderColor: theme.border, flex: 1, marginLeft: 8 }]}> 
              <Text style={[styles.secondaryText, { color: theme.text }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => handleNavigateTo('/register')} style={[styles.linkButton, { borderColor: theme.primary }]}> 
            <Text style={[styles.linkText, { color: theme.primary }]}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.overlay, { backgroundColor: theme.background + 'd0' }]}> 
      <View style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <View style={styles.progressArea}>
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: theme.primary }]} />
          </View>
          <Text style={[styles.progressLabel, { color: theme.textDim }]}>{progressLabel}</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{showStep.title}</Text>
        <Text style={[styles.description, { color: theme.textDim }]}>{showStep.description}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={stopTour} style={[styles.secondaryButton, { borderColor: theme.border }]}> 
            <Text style={[styles.secondaryText, { color: theme.text }]}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextStep} style={[styles.primaryButton, { backgroundColor: theme.primary }]}> 
            <Text style={[styles.primaryText, { color: theme.surface }]}>{showStep.button}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
    zIndex: 999,
  },
  dialog: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 14,
    fontWeight: '600',
  },
  authButtonsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  linkButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressArea: {
    marginBottom: 18,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
});
