import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import en from '../locales/en.json';
import zh from '../locales/zh.json';

const resources = {
    en: { translation: en },
    zh: { translation: zh }
};

const languageDetector = {
    type: 'languageDetector',
    async: true,
    detect: (cb: (lang: string) => void) => {
        const locales = RNLocalize.getLocales();
        cb(locales[0]?.languageCode || 'en');
    },
    init: () => { },
    cacheUserLanguage: () => { }
};

i18n
    .use(languageDetector as any)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: { escapeValue: false }
    });

export default i18n;