import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'zh';

const STORAGE_KEY = '@twinxcare/language';
let activeLanguage: Language = 'en';

interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextProps>({
  lang: 'en',
  setLang: () => {},
  toggleLanguage: () => {},
});

export const getActiveLanguage = () => activeLanguage;
export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!mounted) return;
        const next: Language =
          saved === 'zh' || saved === 'en'
            ? saved
            : getLocales()[0]?.languageCode === 'zh'
              ? 'zh'
              : 'en';
        activeLanguage = next;
        setLanguageState(next);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const setLang = (next: Language) => {
    activeLanguage = next;
    setLanguageState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggleLanguage: () => setLang(lang === 'en' ? 'zh' : 'en'),
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
