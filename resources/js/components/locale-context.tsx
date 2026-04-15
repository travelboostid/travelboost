import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'locale-code';

type LocaleContextType = {
  locale: string;
  setLocale: (locale: string) => void;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

function getInitialLocale(defaultLocale: string) {
  if (typeof window === 'undefined') return defaultLocale;

  const saved = localStorage.getItem(STORAGE_KEY);
  return saved || defaultLocale;
}

export function LocaleProvider({
  children,
  defaultLocale = 'en',
}: {
  children: React.ReactNode;
  defaultLocale?: string;
}) {
  const [locale, setLocaleState] = useState(() =>
    getInitialLocale(defaultLocale),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }

  return context;
}
