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

export function isMarketingPath(
    pathname: string = window.location.pathname,
): boolean {
    if (pathname === '/') {
        return true;
    }

    return MARKETING_PATH_PREFIXES.some(
        (prefix) =>
            prefix !== '/' &&
            (pathname === prefix || pathname.startsWith(`${prefix}/`)),
    );
}
