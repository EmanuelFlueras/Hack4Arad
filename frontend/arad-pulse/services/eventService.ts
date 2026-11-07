import { apiRequest } from './api';

export interface BackendEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate?: string | null;
  endDate?: string | null;
  isTba?: boolean;
  partners?: Array<{
    id: string;
    name: string;
    category?: string;
    phone?: string;
    location?: string;
  }>;
  reviews?: {
    id: string;
    rating: number;
    comment: string;
  }[];
}

export const eventService = {
  async getAll(): Promise<BackendEvent[]> {
    return apiRequest<BackendEvent[]>('/events');
  },
};