// resources/js/hooks/use-analytics.ts

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
        fbq?: (...args: any[]) => void;
    }
}

function track(event: string, params: Record<string, any> = {}) {
    if (typeof window === 'undefined' || !window.gtag) {
        return;
    }

    window.gtag('event', event, params);
}

function trackMeta(event: string, params: Record<string, any> = {}) {
    if (typeof window === 'undefined' || !window.fbq) {
        return;
    }

    window.fbq('track', event, params);
}

const metaEventMap: Record<string, string> = {
    page_view: 'PageView',
    view_item: 'ViewContent',
    generate_lead: 'Lead',
    sign_up: 'CompleteRegistration',
    login: 'Login',
    search: 'Search',
    contact: 'Contact',
    share: 'Share',
};

export default function useAnalytics() {
    return {
        track,

        pageView(path?: string, title?: string) {
            const params = {
                page_path: path ?? window.location.pathname,
                page_title: title ?? document.title,
                page_location: window.location.href,
            };

            track('page_view', params);
            trackMeta('PageView');
        },

        search(searchTerm: string) {
            track('search', {
                search_term: searchTerm,
            });
            trackMeta('Search', {
                search_string: searchTerm,
            });
        },

        login(method = 'password') {
            track('login', {
                method,
            });
            trackMeta('Login', {
                method,
            });
        },

        signUp(method = 'password') {
            track('sign_up', {
                method,
            });
            trackMeta('CompleteRegistration', {
                method,
            });
        },

        share(contentType: string, itemId?: string) {
            track('share', {
                content_type: contentType,
                item_id: itemId,
            });
            trackMeta('Share', {
                content_type: contentType,
                item_id: itemId,
            });
        },

        selectContent(contentType: string, itemId: string) {
            track('select_content', {
                content_type: contentType,
                item_id: itemId,
            });
        },

        viewItem(itemId: string, itemName: string) {
            track('view_item', {
                items: [
                    {
                        item_id: itemId,
                        item_name: itemName,
                    },
                ],
            });
            trackMeta('ViewContent', {
                content_ids: [itemId],
                content_name: itemName,
            });
        },

        generateLead(source?: string) {
            track('generate_lead', {
                source,
            });
            trackMeta('Lead', {
                source,
            });
        },

        contact(method: string) {
            track('contact', {
                method,
            });
            trackMeta('Contact', {
                method,
            });
        },

        exception(description: string, fatal = false) {
            track('exception', {
                description,
                fatal,
            });
        },

        custom(event: string, params: Record<string, any> = {}) {
            track(event, params);

            const metaEvent = metaEventMap[event] ?? event;

            trackMeta(metaEvent, params);
        },
    };
}
