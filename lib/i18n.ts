// lib/i18n.ts
// Initialize react-i18next for client-side translations

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend) // load translations using http
  .use(LanguageDetector) // detect user language
  .use(initReactI18next) // pass i18n down to react-i18next
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'it', 'pl'], // Only these languages are supported
    preload: ['en', 'it', 'pl'], // Preload all languages
    load: 'languageOnly', // Use 'en' instead of 'en-GB'
    debug: true, // Enable debug mode temporarily
    ns: ['common'], // Namespaces to load
    defaultNS: 'common', // Default namespace to use

    backend: {
      loadPath: '/locales/{{lng}}/common.json',
    },

    interpolation: {
      escapeValue: false // react already safe from xss
    },

    detection: {
      order: ['localStorage', 'cookie', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      cookieMinutes: 10080, // 7 days
      convertDetectedLanguage: (lng) => {
        // Convert en-GB, en-US, etc. to just 'en'
        // Convert it-IT to 'it', etc.
        return lng.split('-')[0];
      }
    }
  });

export default i18n;
