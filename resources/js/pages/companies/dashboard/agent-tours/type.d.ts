import type { TourCategory, TourResource } from '@/api/model';

export type AgentTour = {
    id: number;
    category_id: number | null;
    category: TourCategory | null;
    tour: TourResource;
    status?: string | null;
    created_at?: string;
    agent_document_id?: number | null;
    agent_document?: unknown;
    agent_itinerary_upload_enabled?: boolean;
};
