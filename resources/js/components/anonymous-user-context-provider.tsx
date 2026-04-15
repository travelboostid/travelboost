import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { createContext, useContext } from 'react';
export type AnonymousUserContextType = {
  id: number | null;
  token: string | null;
};

export const AnonymousUserContext = createContext<AnonymousUserContextType>({
  id: null,
  token: null,
});

export default function AnonymousUserContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { auth, anonymousUser: sharedAnonymousUser } = usePageSharedDataProps();

  const resolvedId = sharedAnonymousUser?.id ?? null;
  const resolvedToken = sharedAnonymousUser?.token ?? null;

  return (
    <AnonymousUserContext.Provider
      value={{
        id: resolvedId,
        token: resolvedToken,
      }}
    >
      {children}
    </AnonymousUserContext.Provider>
  );
}

export const useAnonymousUserContext = () => {
  const value = useContext(AnonymousUserContext);

  return value;
};
