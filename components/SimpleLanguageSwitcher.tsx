// components/SimpleLanguageSwitcher.tsx
'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
];

export default function SimpleLanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // Debug: Log current language
  console.log('🌍 Current language:', i18n.language);
  console.log('🌍 Available languages:', i18n.languages);

  const handleLanguageChange = async (code: string) => {
    console.log('🔄 Changing language to:', code);
    await i18n.changeLanguage(code);
    console.log('✅ Language changed to:', i18n.language);
    setIsOpen(false);

    // Force a page reload to ensure all components re-render with new language
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition border border-gray-300"
        title="Change language"
      >
        <span className="text-xl">{currentLanguage.flag}</span>
        <span className="font-medium text-gray-700">{currentLanguage.code.toUpperCase()}</span>
        <Globe className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition ${
                  language.code === i18n.language ? 'bg-indigo-50' : ''
                }`}
              >
                <span className="text-xl">{language.flag}</span>
                <span className="font-medium text-gray-700">{language.name}</span>
                {language.code === i18n.language && (
                  <span className="ml-auto text-indigo-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
