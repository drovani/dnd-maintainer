import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import commonEn from '@/locales/en/common.json'
import gamedataEn from '@/locales/en/gamedata.json'

i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'gamedata'],
    resources: {
      en: { common: commonEn, gamedata: gamedataEn }
    },
    interpolation: { escapeValue: false },
  })
  .catch((err: unknown) => console.error('i18n initialization failed:', err))

export default i18n
