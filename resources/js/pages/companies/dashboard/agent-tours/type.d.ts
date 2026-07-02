import type { TourCategory, TourResource } from '@/api/model';

export type AgentTourResource = TourResource & {
    cover_image_url?: string | null;
    vendor_document_name?: string | null;
};

export type AgentTour = {
    id: number;
    category_id: number | null;
    category: TourCategory | null;
    tour: AgentTourResource;
    total_active_seats?: number;
    status?: string | null;
    created_at?: string;
    agent_document_id?: number | null;
    agent_document_name?: string | null;
    agent_itinerary_upload_enabled?: boolean;
    vendor_document_url?: string | null;
    agent_document_url?: string | null;
    itinerary_document_url?: string | null;
    itinerary_document_source?: 'agent' | 'vendor' | null;
};
