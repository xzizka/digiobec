import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import cs from './locales/cs.json'
import en from './locales/en.json'

// cs.json/en.json are already namespace-shaped (top-level keys "common",
// "auth", "dashboard", "submissions", ...) - every page calls
// `useTranslation('auth')`, `useTranslation('dashboard')`, etc. expecting
// each of those to be its own i18next namespace. Wrapping them in a single
// `{ translation: cs }` bundle (the previous config) put everything under
// one "translation" namespace instead, so any `useTranslation(ns)` call with
// a non-default `ns` silently returned the raw key instead of the Czech/
// English text - i.e. "loginTitle" instead of "Přihlášení do administrace"
// everywhere in the app. Passing `cs`/`en` directly registers each of their
// top-level keys as the matching namespace.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      cs,
      en,
    },
    fallbackLng: 'cs',
    supportedLngs: ['cs', 'en'],
    defaultNS: 'common',
    ns: Object.keys(cs),
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n