import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import uz from './locales/uz.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

const getInitialLanguage = (): string => {
  const savedLang = localStorage.getItem('tripuz_lang');
  if (savedLang && ['uz', 'en', 'ru'].includes(savedLang)) {
    return savedLang;
  }
  const navLang = navigator.language || '';
  if (navLang.startsWith('ru')) return 'ru';
  if (navLang.startsWith('en')) return 'en';
  return 'uz';
};

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'uz',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
