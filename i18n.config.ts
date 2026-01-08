export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'es', 'it', 'pl'],
} as const;

export type Locale = (typeof i18n)['locales'][number];