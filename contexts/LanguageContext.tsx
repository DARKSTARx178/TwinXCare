import { auth, db } from '@/firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Language = 'en' | 'zh' | 'ms' | 'ta';
interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextProps>({
  lang: 'en',
  setLang: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setLang('en');
          return;
        }

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const savedLanguage = userDoc.exists() ? userDoc.data()?.language : null;

        if (savedLanguage === 'en' || savedLanguage === 'zh' || savedLanguage === 'ms' || savedLanguage === 'ta') {
          setLang(savedLanguage);
        } else {
          setLang('en');
          await setDoc(userDocRef, { language: 'en' }, { merge: true });
        }
      } catch (error) {
        console.warn('Error loading language preference:', error);
        setLang('en');
      }
    });

    return unsubscribe;
  }, []);

  const updateLang = async (nextLang: Language) => {
    setLang(nextLang);
    try {
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'users', user.uid), { language: nextLang }, { merge: true });
      }
    } catch (error) {
      console.warn('Error saving language preference:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: updateLang }}>
      {children}
    </LanguageContext.Provider>
  );
};
