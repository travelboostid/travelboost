import { useSetupAnonymousUser } from '@/api/anonymous-user/anonymous-user';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { createContext, useContext, useEffect } from 'react';

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
    const { auth } = usePageSharedDataProps();
    const setup = useSetupAnonymousUser();
    const { mutate, reset } = setup;
    const userId = auth?.user?.id ?? null;

    useEffect(() => {
        if (userId === null) {
            mutate();
        } else {
            reset();
        }
    }, [userId, mutate, reset]);

    return (
        <AnonymousUserContext.Provider
            value={{
                id: setup.data?.data?.id ?? null,
                token: setup.data?.data?.token ?? null,
            }}
        >
            {children}
        </AnonymousUserContext.Provider>
    );
}

export const useAnonymousUserContext = () => {
    return useContext(AnonymousUserContext);
};
