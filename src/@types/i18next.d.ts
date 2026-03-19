declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    // Typed resources are intentionally omitted: all keys are dynamic template
    // literals (e.g. `races.${raceId}`) so strict key checking provides no
    // value and requires pervasive `as never` casts throughout the codebase.
    allowObjectInHTMLChildren: true
    returnNull: false
  }
}
