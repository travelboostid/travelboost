import type { TourCategory, TourResource } from '@/api/model';

export type AgentTour = {
  id: number;
  category_id: number;
  category: TourCategory;
  tour: TourResource;
};
