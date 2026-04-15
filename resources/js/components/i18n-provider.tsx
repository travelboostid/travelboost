import en from '@/lang/en.json';
import { IntlProvider } from 'react-intl';

const messagesMap = {
  en,
};

export default function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = 'en'; // Default to English if locale is not set

  return (
    <IntlProvider
      locale={'en'}
      messages={
        messagesMap[locale as keyof typeof messagesMap] || messagesMap['en']
      }
    >
      {children}
    </IntlProvider>
  );
}
