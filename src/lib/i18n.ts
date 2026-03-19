import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import commonEn from '@/locales/en/common.json'
import gamedataEn from '@/locales/en/gamedata.json'
import toolkitEn from '@/locales/en/toolkit.json'

i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'gamedata', 'toolkit'],
    resources: {
      en: { common: commonEn, gamedata: gamedataEn, toolkit: toolkitEn }
    },
    interpolation: { escapeValue: false },
  })

export default i18n
