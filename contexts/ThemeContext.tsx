import { auth, db } from '@/firebase/firebase';
import { getThemeColors as defaultGetThemeColors } from '@/utils/theme';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React from 'react';

type ThemeShape = ReturnType<typeof defaultGetThemeColors>;

const defaultTheme = defaultGetThemeColors();

export const ThemeContext = React.createContext<{
  theme: ThemeShape;
  setTheme: (next: ThemeShape) => void;
}>({ theme: defaultTheme, setTheme: () => {} });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = React.useState<ThemeShape>(defaultTheme);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Fetch theme from Firestore using current auth user
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists() && userDoc.data()?.theme) {
            setThemeState(userDoc.data().theme);
          } else {
            setThemeState(defaultTheme);
          }
        } else {
          setThemeState(defaultTheme);
        }
      } catch (e) {
        console.warn('Error loading theme from Firestore:', e);
        setThemeState(defaultTheme);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const setTheme = async (next: ThemeShape) => {
    setThemeState(next);
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { theme: next }, { merge: true });
      }
    } catch (e) {
      console.warn('Error saving theme to Firestore:', e);
    }
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};
