type DebugPerfPayload = {
    location: string;
    message: string;
    data?: Record<string, unknown>;
    hypothesisId?: string;
    runId?: string;
};

export function debugPerfLog({
    location,
    message,
    data = {},
    hypothesisId = '',
    runId = 'initial',
}: DebugPerfPayload): void {
    const payload = {
        sessionId: '4b26bb',
        location,
        message,
        data,
        timestamp: Date.now(),
        hypothesisId,
        runId,
    };

    // #region agent log
    const isLocalIngest =
        typeof window !== 'undefined' &&
        ['localhost', '127.0.0.1'].includes(window.location.hostname);

    if (isLocalIngest) {
        fetch(
            'http://127.0.0.1:7542/ingest/b9e8bf3e-2819-4c9d-927a-12d09e0ad2cb',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Debug-Session-Id': '4b26bb',
                },
                body: JSON.stringify(payload),
            },
        ).catch(() => {});
    }

    fetch('/__debug/perf-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).catch(() => {});
    // #endregion
}

export function getNavigationTiming(): Record<string, number> {
    const nav = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;

    if (!nav) {
        return {};
    }

    return {
        ttfbMs: Math.round(nav.responseStart - nav.requestStart),
        domInteractiveMs: Math.round(nav.domInteractive - nav.startTime),
        domContentLoadedMs: Math.round(
            nav.domContentLoadedEventEnd - nav.startTime,
        ),
        loadEventEndMs: Math.round(nav.loadEventEnd - nav.startTime),
        transferSize: nav.transferSize,
        encodedBodySize: nav.encodedBodySize,
    };
}
