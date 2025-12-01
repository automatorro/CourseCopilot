import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

type Translations = { [key: string]: any };

interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => any;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [translations, setTranslations] = useState<{ [key: string]: Translations } | null>(null);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const langs = ['en', 'ro', 'es', 'fr', 'de', 'it'];
        const entries: { [key: string]: Translations } = {};
        for (const code of langs) {
          const res = await fetch(`/locales/${code}.json`);
          const json = await res.json();
          entries[code] = json;
        }
        setTranslations(entries);
      } catch (error) {
        console.error("Failed to load translations:", error);
      }
    };
    loadTranslations();
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = useCallback((key: string, replacements?: { [key: string]: string | number }): any => {
    if (!translations) {
      return key;
    }

    const langTranslations = translations[language];
    if (!langTranslations) {
      return key;
    }

    let result = langTranslations[key];
    
    if (result === undefined) {
      return key;
    }
    
    if (typeof result === 'string' && replacements) {
        Object.keys(replacements).forEach(replacementKey => {
            const value = replacements[replacementKey];
            result = result.replace(new RegExp(`\\{${replacementKey}\\}`, 'g'), String(value));
        });
    }

    return result;
  }, [language, translations]);

  if (!translations) {
    return null; // Or a loading indicator
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
