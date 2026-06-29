import {
    setMidtransPublicConfig,
    type MidtransPublicConfig,
} from '@/lib/midtrans-snap';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

type PageProps = {
    midtrans?: MidtransPublicConfig;
};

export function MidtransConfigBootstrap() {
    const { midtrans } = usePage<PageProps>().props;

    useEffect(() => {
        setMidtransPublicConfig(midtrans);
    }, [midtrans]);

    return null;
}
