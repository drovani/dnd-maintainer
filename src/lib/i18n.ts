import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonEn from '@/locales/en/common.json';
import gamedataEn from '@/locales/en/gamedata.json';

i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'gamedata'],
    resources: {
      en: { common: commonEn, gamedata: gamedataEn },
    },
    interpolation: { escapeValue: false },
    saveMissing: true,
    missingKeyHandler: (_lngs: readonly string[], ns: string, key: string) => {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing translation key: ${ns}:${key}`);
      } else {
        console.error(`[i18n] Missing translation key: ${ns}:${key}`);
      }
    },
  })
  .catch((err: unknown) => {
    console.error('i18n initialization failed:', err);
    throw err;
  });

export default i18n;
