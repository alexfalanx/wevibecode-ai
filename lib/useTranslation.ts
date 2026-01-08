import { useState, useEffect } from 'react';

type Translations = {
  [key: string]: any;
};

export function useTranslation(locale: string = 'en') {
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    fetch(`/locales/${locale}/common.json`)
      .then((res) => res.json())
      .then((data) => setTranslations(data))
      .catch((err) => console.error('Failed to load translations:', err));
  }, [locale]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return { t, translations };
}