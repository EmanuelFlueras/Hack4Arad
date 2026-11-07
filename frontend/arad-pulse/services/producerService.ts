import { apiRequest } from './api';

export interface Producer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  category: string;
  averageRating: number;
  reviewsReceived: {
    id: string;
    rating: number;
    description: string;
    authorName: string;
    createdAt: string;
  }[];
}

export const producerService = {
  async getAll(): Promise<Producer[]> {
    return apiRequest<Producer[]>('/producers');
  },
};