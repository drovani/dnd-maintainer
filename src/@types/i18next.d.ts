import type commonEn from '@/locales/en/common.json'
import type gamedataEn from '@/locales/en/gamedata.json'
import type toolkitEn from '@/locales/en/toolkit.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof commonEn
      gamedata: typeof gamedataEn
      toolkit: typeof toolkitEn
    }
  }
}
