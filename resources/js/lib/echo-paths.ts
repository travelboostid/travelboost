const VENDOR_TOUR_CATALOG_PATTERN =
    /^\/companies\/[^/]+\/dashboard\/vendors\/[^/]+\/tours\/?$/;

export function isEchoDeferredPath(
    pathname: string = window.location.pathname,
): boolean {
    if (VENDOR_TOUR_CATALOG_PATTERN.test(pathname)) {
        return true;
    }

    return pathname === '/tours' || pathname.startsWith('/tours?');
}

export const CHAT_ECHO_READY_EVENT = 'travelboost:chat-echo-ready';
