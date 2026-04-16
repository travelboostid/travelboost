import en from '@/lang/en.json';
import id from '@/lang/id.json';
import { IntlProvider } from 'react-intl';
import { useLocale } from './locale-context';

const messagesMap = {
  en,
  id,
};

export default function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = useLocale();
  console.log('Current locale:', locale);

  return (
    <IntlProvider
      locale={locale}
      messages={
        messagesMap[locale as keyof typeof messagesMap] || messagesMap['en']
      }
    >
      {children}
    </IntlProvider>
  );
}
