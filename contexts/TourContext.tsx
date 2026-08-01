import { auth, db } from '@/firebase/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const TOUR_COMPLETED_KEY = 'TwinXCareBeginnerTourCompleted';
const TOUR_FIRST_RUN_KEY = 'TwinXCareFirstLaunchDone';

type TourRole = 'admin' | 'user' | 'unknown';

type TourContextType = {
  tourActive: boolean;
  tourStep: number;
  tourRole: TourRole;
  hasSeenTour: boolean;
  tourPromptMessage: string | null;
  startTour: (force?: boolean) => Promise<void>;
  stopTour: () => void;
  pauseTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
};

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider = ({ children }: { children: React.ReactNode }) => {
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(-1);
  const [tourRole, setTourRole] = useState<TourRole>('unknown');
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [tourPromptMessage, setTourPromptMessage] = useState<string | null>(null);

  const completeTour = async () => {
    setTourActive(false);
    setHasSeenTour(true);
    try {
      await AsyncStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    } catch (error) {
      console.warn('Failed to save tour completion', error);
    }
  };

  const startTour = async (force = false) => {
    if (tourActive) return;
    if (!force && hasSeenTour) return;
    setTourStep(-1);
    setTourActive(true);
    setTourPromptMessage(null);

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await signOut(auth);
        setTourPromptMessage('You were signed out so you can preview the tutorial without creating a new account.');
      } catch (error) {
        console.warn('Failed to sign out before tutorial', error);
      }
    }
  };

  const stopTour = () => {
    completeTour();
  };

  const pauseTour = () => {
    setTourActive(false);
  };

  const nextStep = () => {
    setTourStep((prev) => {
      const steps = tourRole === 'admin' ? 3 : 4;
      if (prev >= steps - 1) {
        completeTour();
        return prev;
      }
      return prev + 1;
    });
  };

  const prevStep = () => {
    setTourStep((prev) => Math.max(0, prev - 1));
  };

  useEffect(() => {
    let mounted = true;

    const loadTourStatus = async () => {
      try {
        const [completedValue, firstRunValue] = await Promise.all([
          AsyncStorage.getItem(TOUR_COMPLETED_KEY),
          AsyncStorage.getItem(TOUR_FIRST_RUN_KEY),
        ]);

        if (!mounted) return;
        const seen = completedValue === 'true';
        setHasSeenTour(seen);

        if (firstRunValue !== '1') {
          await AsyncStorage.setItem(TOUR_FIRST_RUN_KEY, '1');
          if (!seen) {
            await startTour(true);
          }
        }
      } catch (error) {
        console.warn('Failed to load tour status', error);
      }
    };

    loadTourStatus();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setTourRole('user');
        return;
      }
      try {
        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setTourRole(data?.role === 'admin' ? 'admin' : 'user');
        } else {
          setTourRole('user');
        }

        if (tourActive && tourStep === -1) {
          setTourStep(0);
        }
      } catch (error) {
        console.warn('Failed to determine tour role', error);
        setTourRole('user');
      }
    });

    return () => unsubscribe();
  }, [tourActive, tourStep]);

  const value = useMemo(
    () => ({ tourActive, tourStep, tourRole, hasSeenTour, tourPromptMessage, startTour, stopTour, pauseTour, nextStep, prevStep }),
    [tourActive, tourStep, tourRole, hasSeenTour, tourPromptMessage]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
