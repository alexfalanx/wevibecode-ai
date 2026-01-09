// i18n.config.ts
export const locales = ['en', 'it', 'pl', 'es', 'de'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];
