import { FormattedMessage } from 'react-intl';
import RealtimeDeviceBreakdown from './realtime-device-breakdown';
import RealtimeEvents from './realtime-events';
import RealtimeOverview from './realtime-overview';
import RealtimeTopCountries from './realtime-top-countries';
import RealtimeTopPages from './realtime-top-pages';

export default function AnalyticsRealtimeContent() {
    return (
        <>
            <RealtimeOverview />

            <div className="grid gap-4 lg:grid-cols-2">
                <RealtimeDeviceBreakdown />
                <RealtimeTopPages />
                <RealtimeTopCountries />
                <RealtimeEvents />
            </div>

            <p className="text-center text-xs text-muted-foreground">
                <FormattedMessage defaultMessage="Live data reflects the last 30 minutes and refreshes about every 20 seconds on the server. Use Refresh to pull the latest snapshot." />
            </p>
        </>
    );
}
