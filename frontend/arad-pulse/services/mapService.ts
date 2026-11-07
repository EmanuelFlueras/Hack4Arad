import { apiRequest } from './api';

export interface MapPoint {
	id: string;
	title: string;
	type: 'PRODUCER' | 'EVENT';
	latitude: number;
	longitude: number;
	category?: string;
	address?: string;
	description?: string;
}

export const mapService = {
	async getPoints(): Promise<MapPoint[]> {
		return apiRequest<MapPoint[]>('/map/points', { method: 'GET' });
	},
};
