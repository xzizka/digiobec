import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import cs from './locales/cs.json';
import en from './locales/en.json';

// cs.json/en.json are namespace-shaped (top-level keys "common", "catalog",
// "submission", "tracking", "footer", "accessibility" - one i18next
// namespace each). Passing them directly as the per-language resource
// bundle (NOT wrapped in `{ translation: cs }`) registers every top-level
// key as its own namespace, matching every page's `useTranslation(ns)` call.
// See apps/admin-web/src/i18n/index.ts (Plan 06) for the bug this avoids:
// wrapping in a single `translation` namespace made every namespaced
// `t()` call silently render the raw key instead of Czech/English text.
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
  });

export default i18n;
