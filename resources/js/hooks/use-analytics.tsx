// resources/js/hooks/use-analytics.ts

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

function track(event: string, params: Record<string, any> = {}) {
    if (typeof window === 'undefined' || !window.gtag) {
        return;
    }

    window.gtag('event', event, params);
}

export default function useAnalytics() {
    return {
        track,

        pageView(path?: string, title?: string) {
            track('page_view', {
                page_path: path ?? window.location.pathname,
                page_title: title ?? document.title,
                page_location: window.location.href,
            });
        },

        search(searchTerm: string) {
            track('search', {
                search_term: searchTerm,
            });
        },

        login(method = 'password') {
            track('login', {
                method,
            });
        },

        signUp(method = 'password') {
            track('sign_up', {
                method,
            });
        },

        share(contentType: string, itemId?: string) {
            track('share', {
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
        },

        generateLead(source?: string) {
            track('generate_lead', {
                source,
            });
        },

        contact(method: string) {
            track('contact', {
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
        },
    };
}
