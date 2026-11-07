import { apiRequest } from './api';

export interface BackendEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  image?: string | null;
  date?: string | Date | null;
  startDate?: string | null;
  endDate?: string | null;
  isTba?: boolean;
  creator?: {
    id: string;
    name: string;
    phone?: string;
  } | null;
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