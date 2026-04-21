import 'i18next';
import type common from '@/locales/en/common.json';
import type gamedata from '@/locales/en/gamedata.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      gamedata: typeof gamedata;
    };
  }
}
