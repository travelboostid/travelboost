import type { MediaResource } from '@/api/model';

export type AdminTourProductRow = {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    duration_days?: number | null;
    status: string;
    destination?: string | null;
    showprice?: number | null;
    promote_title?: string | null;
    promote_price?: number | null;
    promote_note?: string | null;
    earlybird?: number | null;
    earlybird_note?: string | null;
    currency?: string | null;
    company_id: number;
    schedules_count: number;
    continent_name?: string | null;
    region_name?: string | null;
    country_name?: string | null;
    company?: {
        id: number;
        name: string;
        username?: string;
    } | null;
    category?: {
        id: number;
        name: string;
    } | null;
    image?: MediaResource | null;
    created_at?: string | null;
};

export type PaginatedTourProducts = {
    data: AdminTourProductRow[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};
