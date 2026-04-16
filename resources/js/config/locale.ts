export type LocaleConfig = {
  code: string;
  name: string;
};

export const LOCALES: LocaleConfig[] = [
  { code: 'en', name: 'English' },
  { code: 'id', name: 'Indonesian' },
];

export const DEFAULT_LOCALE = 'en';
