const MARKETING_PATH_PREFIXES = [
    '/',
    '/home',
    '/about',
    '/contact',
    '/learn-more',
    '/pricing',
    '/privacy',
    '/terms-and-conditions',
    '/cookie-policy',
] as const;

function isMainAppHost(hostname: string = window.location.hostname): boolean {
    const appHost = import.meta.env.VITE_APP_HOST;

    if (!appHost) {
        return true;
    }

    return hostname === appHost || hostname === `www.${appHost}`;
}

export function isMarketingPath(
    pathname: string = window.location.pathname,
    hostname: string = window.location.hostname,
): boolean {
    // Tenant, affiliate, and custom domains also serve "/" but need Echo for chat.
    if (pathname === '/' && !isMainAppHost(hostname)) {
        return false;
    }

    if (pathname === '/') {
        return true;
    }

    return MARKETING_PATH_PREFIXES.some(
        (prefix) =>
            prefix !== '/' &&
            (pathname === prefix || pathname.startsWith(`${prefix}/`)),
    );
}
